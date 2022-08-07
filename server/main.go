package main

import (
	"context"
	"flag"
	"fmt"
	"log"
	"time"

	"cloud.google.com/go/firestore"
	"github.com/labstack/echo"
	"github.com/typesense/typesense-go/typesense"
	"google.golang.org/api/option"
)

type Config struct {
	HttpAddr  string
	Typesense struct {
		ApiKey string
		URL    string
	}
	Firestore struct {
		CredsPath string
		ProjectId string
	}
}

func main() {

	if err := run(); err != nil {
		log.Fatal(err)
	}

}

func run() error {
	var cfg Config
	flag.StringVar(&cfg.HttpAddr, "http.addr", "0.0.0.0:8000", "HTTP bind address.")
	flag.StringVar(&cfg.Typesense.ApiKey, "typesense.key", "", "API Key to use for Typesense.")
	flag.StringVar(&cfg.Typesense.URL, "typesense.url", "http://typesense:8108", "URL to Typesense server.")
	flag.StringVar(&cfg.Firestore.CredsPath, "firestore.creds", "", "Path to service account for firestore.")
	flag.StringVar(&cfg.Firestore.ProjectId, "firestore.projectid", "", "Firestore project id.")

	flag.Parse()

	ctx := context.Background()

	// Connect to firestore database.
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

	// Check if typesense documents need to be recreated.
	equal, err := compareDataCounts(ctx, ts, fs)
	if err != nil {
		return err
	}

	if !equal {
		if err := recreateLinkCollection(ctx, &cfg, ts, fs); err != nil {
			return err
		}
	}

	// Setup HTTP server.
	mux := echo.New()

	mux.GET("/search", SearchHandler(ts, &cfg))

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
	if err := createLinkCollection(ts); err != nil {
		return err
	}

	links, err := extractLinksFromFirestore(ctx, fs)
	if err != nil {
		return err
	}

	return loadLinksToTypesense(ts, links)
}
