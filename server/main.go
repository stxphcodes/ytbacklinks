package main

import (
	"context"
	"flag"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"

	"cloud.google.com/go/firestore"
	"github.com/google/go-github/v47/github"
	"github.com/heptiolabs/healthcheck"
	"github.com/labstack/echo"
	"github.com/labstack/echo/middleware"
	"github.com/typesense/typesense-go/typesense"
	"golang.org/x/oauth2"
	"google.golang.org/api/option"
)

type Config struct {
	HttpAddr    string
	HealthAddr  string
	CORSOrigins string
	Typesense   struct {
		ApiKey string
		URL    string
	}
	Firestore struct {
		CredsPath string
		ProjectId string
	}
	Github struct {
		PersonalAccessToken string
	}
}

func main() {
	if err := run(); err != nil {
		log.Fatal(err)
	}
}

func run() error {
	var (
		cfg           Config
		forceRecreate bool
		skipFirestore bool
	)
	flag.StringVar(&cfg.HttpAddr, "http.addr", "0.0.0.0:8000", "HTTP bind address.")
	flag.StringVar(&cfg.HealthAddr, "health.addr", "0.0.0.0:8001", "HTTP health address.")
	flag.StringVar(&cfg.CORSOrigins, "cors.origin", "*", "CORS origins, separated by ,")
	flag.StringVar(&cfg.Typesense.ApiKey, "typesense.key", "", "API Key to use for Typesense.")
	flag.StringVar(&cfg.Typesense.URL, "typesense.url", "http://typesense:8108", "URL to Typesense server.")
	flag.StringVar(&cfg.Firestore.CredsPath, "firestore.creds", "", "Path to service account for firestore.")
	flag.StringVar(&cfg.Firestore.ProjectId, "firestore.projectid", "", "Firestore project id.")
	flag.StringVar(&cfg.Github.PersonalAccessToken, "github.pat", "", "Github personal access token.")
	flag.BoolVar(&forceRecreate, "force.recreate", false, "Force recreate typesense collection.")
	flag.BoolVar(&skipFirestore, "skip.firestore", false, "Skip checking firestore for new docs.")

	flag.Parse()

	ctx := context.Background()

	// Initialize firestore client.
	fs, err := firestore.NewClient(
		ctx,
		cfg.Firestore.ProjectId,
		option.WithCredentialsFile(cfg.Firestore.CredsPath))
	if err != nil {
		return err
	}
	defer fs.Close()

	// Initialize typesense client.
	ts := typesense.NewClient(
		typesense.WithServer(cfg.Typesense.URL),
		typesense.WithAPIKey(cfg.Typesense.ApiKey),
	)

	b, err := ts.Health(20 * time.Second)
	if err != nil || !b {
		return fmt.Errorf("error initializing typesense client %s", err.Error())
	}

	// Initialize github client.
	auth := oauth2.StaticTokenSource(
		&oauth2.Token{AccessToken: cfg.Github.PersonalAccessToken},
	)
	gh := github.NewClient(oauth2.NewClient(ctx, auth))

	switch true {
	case forceRecreate:
		if err := recreateChannelCollection(ctx, &cfg, ts, fs); err != nil {
			return err
		}
		log.Printf("Recreated channels collection in typesense.")

		if err := recreateVideoCollection(ctx, &cfg, ts, fs); err != nil {
			return err
		}
		log.Printf("Recreated video collection in typesense.")

		if err := recreateLinkCollection(ctx, &cfg, ts, fs); err != nil {
			return err
		}
		log.Printf("Recreated link collection in typesense.")

		tsLinkCount, err := getTSDocCount(ts)
		if err != nil {
			return err
		}

		log.Println("this is ts link count")
		log.Println(tsLinkCount)

	case skipFirestore:
		log.Printf("Skipped recreating all collections in typesense.")
		break

	default:
		equal, err := compareDataCounts(ctx, ts, fs)
		if err != nil {
			return err
		}

		if equal {
			log.Printf("No need to recreate link collection in typesense.")
		} else {
			if err := recreateLinkCollection(ctx, &cfg, ts, fs); err != nil {
				return err
			}
			log.Printf("Recreated link collection in typesense.")
		}
	}

	// Configure and start /live and /ready check handling.
	health := healthcheck.NewHandler()
	// Check for resource leaks (also indicates basic responsiveness).
	health.AddLivenessCheck("goroutine-threshold", healthcheck.GoroutineCountCheck(100))
	go http.ListenAndServe(cfg.HealthAddr, health)

	// Setup HTTP server.
	mux := echo.New()
	mux.Pre(middleware.RemoveTrailingSlash())
	mux.Use(middleware.Logger())
	cors := middleware.DefaultCORSConfig
	cors.AllowOrigins = strings.Split(cfg.CORSOrigins, ",")
	mux.Use(middleware.CORSWithConfig(cors))

	// For gke ingress health check
	mux.GET("/", func(ctx echo.Context) error {
		return ctx.JSON(200, nil)
	})
	mux.GET("/channels", ChannelsHandler(ts, &cfg))
	mux.GET("/channel/:channelId", ChannelHandler(ts, &cfg))
	mux.POST("/channels/search", ChannelSearchHandler(ts, &cfg))
	mux.POST("/links/search", LinkSearchHandler(ts, &cfg))
	mux.POST("/videos/search", VideoSearchHandler(ts, &cfg))
	mux.POST("/channel/new", NewChannelHandler(gh, &cfg))

	return mux.Start(cfg.HttpAddr)
}

func compareDataCounts(ctx context.Context, ts *typesense.Client, fs *firestore.Client) (bool, error) {
	fsLinkCount, err := getFSLinkCount(ctx, fs)
	if err != nil {
		return false, err
	}

	tsLinkCount, err := getTSDocCount(ts)
	if err != nil {
		return false, err
	}

	return tsLinkCount == fsLinkCount, nil
}

func recreateLinkCollection(ctx context.Context, cfg *Config, ts *typesense.Client, fs *firestore.Client) error {
	links, err := extractLinksFromFirestore(ctx, fs)
	if err != nil {
		return err
	}

	if err := createLinkCollection(ts); err != nil {
		return err
	}

	return loadToTypesense(ts, LINK_COLLECTION, links)
}

func recreateVideoCollection(ctx context.Context, cfg *Config, ts *typesense.Client, fs *firestore.Client) error {
	videos, err := extractVideosFromFirestore(ctx, fs)
	if err != nil {
		return err
	}

	if err := createVideoCollection(ts); err != nil {
		return err
	}

	return loadToTypesense(ts, VIDEO_COLLECTION, videos)
}

func recreateChannelCollection(ctx context.Context, cfg *Config, ts *typesense.Client, fs *firestore.Client) error {
	channels, err := extractChannelsFromFirestore(ctx, fs)
	if err != nil {
		return err
	}

	if err := createChannelCollection(ts); err != nil {
		return err
	}

	return loadToTypesense(ts, CHANNEL_COLLECTION, channels)
}
