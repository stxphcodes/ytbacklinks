package main

import (
	"encoding/base64"
	"fmt"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestParseVideoDescription(t *testing.T) {
	const theneedledrop = `2022 FAV TRACKS PLAYLIST: https://music.apple.com/us/playlist/m

TND Patreon: https://www.patreon.com/theneedledrop
	
Turntable Lab link: http://turntablelab.com/theneedledrop
	
Austen's shoutout: Kali Malone - Living Torch
https://kalimalone.bandcamp.com/album
	
	
!!!BEST TRACKS THIS WEEK!!!
	
Margaret Glaspy - My Body My Choice
https://youtu.be/3sC0RTng9lk
	
Hot Chip - Eleanor
https://youtu.be/nRqHrmAePDE
	
Steve Lacy - Bad Habit
https://www.youtube.com/watch?v=VF-FG
	
Jane Remover - Royal Blue Walls
https://www.youtube.com/watch?v=Z9Rbr
	
Joey Bada$$ - Survivor's Guilt
https://www.youtube.com/watch?v=aMe80

CHAI - Hero Journey ft. Superorganism
https://www.youtube.com/watch?v=0avSS
	
NLE Choppa - In the UK
https://www.youtube.com/watch?v=uwllF
	
Superorganism - Into the Sun ft. Stephen Malkmus
https://youtu.be/ObfX2kpeJnk
	
Imperial Triumphant - Tower of Glory, City of Shame
https://www.youtube.com/watch?v=c25Sn
	
Metric - False Dichotomy
https://youtu.be/fxAIn2OOpwI
	
Cryalot - Hell Is Here
https://www.youtube.com/watch?v=4Tash
	
easylife, BENEE - OTT
https://youtu.be/Maa7WVLX2Ts
	
Alice Longyu Gao & Oli Sykes - Believe the Hype
https://www.youtube.com/watch?v=r4GR7
	
Doechii - Bitch I'm Nice
https://www.youtube.com/watch?v=U6I1c
	
Sudan Archives - NBPQ (Topless)
https://youtu.be/yxKYFA_fz6s
	
DOMi / JD BECK & Anderson .Paak - Take a Chance
https://www.youtube.com/watch?v=jJVe_
	
	
...meh...
	
The Bad Plus - Sun Wall
https://youtu.be/MCNsWsJkLuI
	
Killer Mike - Run ft. Young Thug
https://youtu.be/yfFeNTcmGPY
	
bbno$ & Diplo - pogo
https://www.youtube.com/watch?v=ooAJr
	
Bring Me the Horizon - sTraNgeRs
https://www.youtube.com/watch?v=FsNGx
	
Rina Sawayama - Catch Me in the Air
https://www.youtube.com/watch?v=XHpW9
	
Daphni - Cherry
https://youtu.be/4OtouIGhwkU
	
Alvvays - Pharmacist
https://youtu.be/eH5mqLjwg6U
	
The 1975 - Part of the Band
https://youtu.be/87nG3LuabUs
	
	
!!!WORST TRACKS THIS WEEK!!!
	
Fivio Foreign & The Kid LAROI - Paris to Tokyo
https://www.youtube.com/watch?v=uRfnV
	
===================================
Subscribe: http://bit.ly/1pBqGCN
	
Patreon: https://www.patreon.com/theneedledrop
	
Official site: http://theneedledrop.com
	
Twitter: http://twitter.com/theneedledrop
	
Instagram: https://www.instagram.com/afantano
	
TikTok: https://www.tiktok.com/@theneedletok
	
TND Twitch: https://www.twitch.tv/theneedledrop
===================================
	
Y'all know this is just my opinion, right?`

	const jennim = `Welcome to a video of EVERYTHING I use on the daily, all under $100. Hope you enjoy this master list of useful gadgets and things that I use to make adulting more enjoyable. 


-----------------------------------------

Subscribe and become a Jem today: http://bit.ly/2iLayjY

------------------------------------------

➫ Instagram: http://instagram.com/imjennim
➫ Twitter: http://twitter.com/imjennim
➫ Facebook: http://facebook.com/imjennim
➫ Spotify: https://bit.ly/JennImSpotify
➫ TikTok: https://bit.ly/2UZB7Zd

------------------------------------------ 

❐ GYM ❏ 
➥ Weight Lifting Gloves: https://amzn.to/3yqNz6O
➥ Party Light: https://amzn.to/3OL60tR

❏ HEALTH ❏ 
➥ Calm App: http://bit.ly/38LS0KV
➥ Warm Eye Compress: https://amzn.to/3P31ozr
➥ Sakara - Digestive Tea: https://amzn.to/3P8gQJW
➥ Pique - Sun Goddess Matcha: https://amzn.to/3NPsx7g
➥ Natural Vitality - Calm: https://amzn.to/3NQSvXX
➥ Lumi - Microdose D9 THC Gummies: https://bit.ly/3yk6fF3
➥ All Healthy - Hydrocolloid Gel Bandages: https://amzn.to/3IlxGDc

❏ HOME ❏ 
➥ Cleaning Caddy: https://amzn.to/3RdjgZK
➥ Blueland - Clean Home Kit: https://amzn.to/3yhFy3L
➥ Blueland - Glass + Mirror Spray: https://bit.ly/3yGkkhr
➥ Blueland - Foaming Hand Soap: https://amzn.to/3yKbOy5

❐ HYGIENE ❏ 
➥ Stainless Steel Tongue Scraper: https://amzn.to/3Rd2aLz
➥ WaterPik - Water Flosser: https://amzn.to/3Au6Jeo
➥ Squatty Potty: https://amzn.to/3bGK8AX
➥ Bathtub Cushion: https://amzn.to/3OL1OKh
➥ Bath Tray: https://amzn.to/3P5Eyqf
➥ Marc Jacobs - Daisy Skies: https://go.magik.ly/ml/1jka0/

❐ KITCHEN ❏ 
➥ Yeti - 36oz Rambler Water Bottle: https://amzn.to/3RfIVRk
➥ Step Stool: https://amzn.to/3nHiJSd
➥ Undershelf Storage Basket: https://amzn.to/3Row6Vc
➥ Gold Clips: https://amzn.to/3bOJLo6
➥ OXO - Salad Dressing Mixer: https://amzn.to/3P4KorP
➥ Milk Jugs: https://amzn.to/3yKEyXy
➥ Fable - Dishware: https://bit.ly/3nIuhVq

❐ OFFICE ❏
➥ Whiteboard: https://amzn.to/3yh7ncI
➥ Webcam Cover: https://amzn.to/3uukI01
➥ Phone Stand: https://amzn.to/3yKNlZx
➥ Handheld Mic: https://amzn.to/3R6A4Bw
➥ Time Timer: https://amzn.to/3IhDJs9
➥ Paper Shredder: https://amzn.to/3NQRi2R

❏ READING ❏ 
➥ The Atlantic: https://amzn.to/3nEBVjJ

------------------------------------------ 

❐ VIDEO CREDIT ❏
➥ Video edited by Adrianna:  https://bit.ly/3zuaHU0
➥ Thumbnail by Catherine: https://bit.ly/3aqRcRH

------------------------------------------

❐ MUSIC ❏
➥ Epidemic Sound

------------------------------------------
FTC: This video is not sponsored! Some of the links above are affiliate links, which means I may earn a small commission if anyone purchases through them. This helps support my channel so I can continue to create videos for ya'll~`

	const vogue = `Midway through a world tour that sees her singing to packed stadiums, Billie Eilish sticks to a nighttime beauty routine both for the sake of her skin and her emotional self.

Shop this beauty routine:

Josie Maran Bear Naked Wipes: https://shop-links.co/chD5XXQPRzP
Biba de Sousa The Zinc Mask: https://fave.co/3yDf7pm
Biba de Sousa Mandelic Cleansing Gel: https://fave.co/3yZVI3i
Biba de Sousa Glycolic Lactic Toner: https://fave.co/3OWdSIV
Biba de Sousa Daily Moisturizer: https://fave.co/3aySnio
Biba de Sousa Cream Barrier: https://fave.co/3AKDSTq
Biba de Sousa Hydrating Toner: https://fave.co/3yzIxou
Olaplex No.6 Bond Smoother: ​​https://shop-links.co/chD524aiWTc
Aquaphor Healing Ointment: https://amzn.to/3PEFTov
Tammy Taylor Thymolize Solution: https://amzn.to/3yz6U5x
Tammy Taylor Peach Conditioning Cuticle Oil: https://amzn.to/3O3MG9I
Laura Mercier Ambre Vanillé Soufflé Body Crème: https://shop-links.co/chD55QppjM5
Eilish Eau de Parfum: https://shop-links.co/chD552eZMgs
Hicarer Towel Headbands: https://amzn.to/3IBtSxv

Shop more Beauty Secrets favorites below:

Chanel Vitalumière Radiant, Moisture-Rich Fluid Foundation: https://shop-links.co/chBzLvwixBO
Kosas Cloud Set Setting Powder: https://shop-links.co/chBzLQyzJ5S
Dieux Skin Forever Eye Masks: https://fave.co/3Pb2Yyu
Saie Hydrabeam Concealer: https://shop-links.co/chBzL0XWkaP
Droplette Microinfusion Device: https://bit.ly/3upy9yn


When you buy something through our retail links, we earn an affiliate commission.

Director: Gabrielle Reich
Editor: Michael Suyeda
Associate Producer: Qieara Lesesne
Production Manager: Kit Fogarty
Production Coordinator: Ava Kashar
Talent Bookers: Phoebe Feinberg, Sergio Kletnoy
Post Production Supervisor: Marco Glinbizzi
Post Production Coordinator: Andrea Farr
Assistant Editor: Andy Morell
Colorist: Alexia Salingaros

Still haven’t subscribed to Vogue on YouTube? ►► http://bit.ly/vogueyoutubesub
Get the best of Vogue delivered right in your inbox ►► https://bit.ly/3xAZyQg
Want to hear more from our editors? Subscribe to the magazine ►► http://bit.ly/2wXh1VW
Check out our new podcast 'In Vogue: The 1990s'  ►► https://link.chtbl.com/iv-yt-description
 
ABOUT VOGUE
Vogue is the authority on fashion news, culture trends, beauty coverage, videos, celebrity style, and fashion week updates.`

	const freesiapark = `She said DIY whoooo? I'm excited to show you how I hacked the IKEA Ivar cabinet into a 96" sideboard/buffet for my kitchen and dining area! Everything I used is linked below.

→ connect with me ☺
subscribe: https://bit.ly/2PJ3DhK 
instagram: @freesiapark

timestamps
       ↳ 00:00-00:49 why i did this
       ↳ 00:50-00:55 pinterest inspo
       ↳ 00:56-01:40 how much it cost
       ↳ 1:41-2:30 start assembly
       ↳ 2:31-5:32 prime
       ↳ 5:33-6:28 paint
       ↳ 6:29-6:38 seal
       ↳ 6:39-7:01 finish assembly
       ↳ 7:02-7:40 styling
       ↳ 7:41-9:44 organizing

→ what you’ll need
       ↳ IKEA ivar cabinet (x3): https://bit.ly/3Akyoi0 
       ↳ plastic drop cloths (5 pack): https://amzn.to/3a8Jegh 
       ↳ paint roller and tray set: https://amzn.to/3OECyW6
       ↳ flat chip brush (x3): https://go.magik.ly/ml/1jg49/
       ↳ flathead screwdriver 
       ↳ philips-head screwdriver       
       ↳ zinsser BIN synthetic shellac primer (1 quart): https://go.magik.ly/ml/1jg4a/ 
       ↳ latex-based paint of your choice (1 quart)
       ↳ behr satin clear water-based polyurethane (1 quart): https://go.magik.ly/ml/1jg4c/

	   → items on display
	   breakfast cabinet
		 ↳ balmuda toaster: https://amzn.to/3AjmlkV 
		 ↳ fellow electric kettle: https://amzn.to/3y7DR8Z
		 ↳ fellow ode brew grinder: https://amzn.to/3abvTnt 
		 ↳ kinto coffee brewer: https://amzn.to/3bFQ1hR 
		 ↳ beaker set: https://amzn.to/3Ak6faE 
		 ↳ hasami porcelain mugs: https://rikumo.com/products/hasami-po
		 ↳ our place drinking glasses: https://go.magik.ly/ml/1jg53/ 
		 ↳ ceramic matcha bowl (no longer available from etsy seller)
		 ↳ empty aesop mouthwash: https://amzn.to/3yyMOJR 
		 ↳ bamboo lid glass food storage container: https://amzn.to/3R2YFY1 
		 ↳ french press (unknown)
  
	   bar cabinet
		 ↳ chemex pour-over glass: https://amzn.to/3RgtWHd
		 ↳ whiskey decanter (unknown)
		 ↳ aime leon dore x porche 911sc poster
  
	   doggy cabinet
		 ↳ the kinfolk home book: https://amzn.to/3NA5qxC
		 ↳ the kinfolk garden book: https://amzn.to/3a3zTXf 
		 ↳ grey textured vase (no longer available from goodies la)
		 ↳ cereal magazine volume 20 (no longer available)
		 ↳ vitruvi stone diffuser: https://amzn.to/3a5A9F9
  
  → business inquiries
  contact@freesiapark.com
  
  → credits
  video editing by freesia
  channel design: https://www.feelsstudio.com/
  
  FTC → this video is not sponsored. 
  
  some of the links above may be affiliate links which means i may earn a small commission. thanks for supporting my channel! 🖤`

	tests := []struct {
		video *Video
		links map[string]*Link
	}{
		{
			&Video{
				Description: theneedledrop,
			},
			map[string]*Link{
				base64.URLEncoding.EncodeToString([]byte("https://music.apple.com/us/playlist/m")): &Link{
					Brand:       "",
					Description: "2022 FAV TRACKS PLAYLIST",
					Href:        "https://music.apple.com/us/playlist/m",
				},
				base64.URLEncoding.EncodeToString([]byte("https://youtu.be/3sC0RTng9lk")): &Link{
					Brand:       "Margaret Glaspy",
					Description: "My Body My Choice",
					Href:        "https://youtu.be/3sC0RTng9lk",
				},
				base64.URLEncoding.EncodeToString([]byte("https://youtu.be/yxKYFA_fz6s")): &Link{
					Brand:       "Sudan Archives",
					Description: "NBPQ (Topless)",
					Href:        "https://youtu.be/yxKYFA_fz6s",
				},
				base64.URLEncoding.EncodeToString([]byte("https://www.youtube.com/watch?v=uRfnV")): &Link{
					Brand:       "Fivio Foreign & The Kid LAROI",
					Description: "Paris to Tokyo",
					Href:        "https://www.youtube.com/watch?v=uRfnV",
				},
			},
		},
		{
			&Video{
				Description: jennim,
			},
			map[string]*Link{
				base64.URLEncoding.EncodeToString([]byte("https://bit.ly/2UZB7Zd")): &Link{
					Brand:       "",
					Description: "TikTok",
					Href:        "https://bit.ly/2UZB7Zd",
				},
				base64.URLEncoding.EncodeToString([]byte("https://go.magik.ly/ml/1jka0/")): &Link{
					Brand:       "Marc Jacobs",
					Description: "Daisy Skies",
					Href:        "https://go.magik.ly/ml/1jka0/",
				},
				base64.URLEncoding.EncodeToString([]byte("https://amzn.to/3RfIVRk")): &Link{
					Brand:       "Yeti",
					Description: "36oz Rambler Water Bottle",
					Href:        "https://amzn.to/3RfIVRk",
				},
				base64.URLEncoding.EncodeToString([]byte("https://bit.ly/3aqRcRH")): &Link{
					Brand:       "Catherine",
					Description: "Thumbnail",
					Href:        "https://bit.ly/3aqRcRH",
				},
			},
		},
		{
			&Video{
				Description: vogue,
			},
			map[string]*Link{
				base64.URLEncoding.EncodeToString([]byte("https://shop-links.co/chD552eZMgs")): &Link{
					Brand:       "",
					Description: "Eilish Eau de Parfum",
					Href:        "https://shop-links.co/chD552eZMgs",
				},
				base64.URLEncoding.EncodeToString([]byte("https://shop-links.co/chBzLvwixBO")): &Link{
					Brand:       "",
					Description: "Chanel Vitalumière Radiant, Moisture-Rich Fluid Foundation",
					Href:        "https://shop-links.co/chBzLvwixBO",
				},
				base64.URLEncoding.EncodeToString([]byte("http://bit.ly/vogueyoutubesub")): &Link{
					Brand:       "",
					Description: "Still haven’t subscribed to Vogue on YouTube",
					Href:        "http://bit.ly/vogueyoutubesub",
				},
				// this fails. come back to this. use regexp
				base64.URLEncoding.EncodeToString([]byte("https://link.chtbl.com/iv-yt-description")): &Link{
					Brand:       "",
					Description: "Check out our new podcast 'In Vogue: The 1990s",
					Href:        "https://link.chtbl.com/iv-yt-description",
				},
			},
		},
		{
			&Video{
				Description: freesiapark,
			},
			map[string]*Link{
				base64.URLEncoding.EncodeToString([]byte("https://bit.ly/3Akyoi0")): &Link{
					Brand:       "",
					Description: "IKEA ivar cabinet (x3)",
					Href:        "https://bit.ly/3Akyoi0",
				},
				base64.URLEncoding.EncodeToString([]byte("https://go.magik.ly/ml/1jg4c/")): &Link{
					Brand:       "",
					Description: "behr satin clear water-based polyurethane (1 quart)",
					Href:        "https://go.magik.ly/ml/1jg4c/",
				},
				base64.URLEncoding.EncodeToString([]byte("https://amzn.to/3RgtWHd")): &Link{
					Brand:       "",
					Description: "chemex pour-over glass",
					Href:        "https://amzn.to/3RgtWHd",
				},
				base64.URLEncoding.EncodeToString([]byte("https://www.feelsstudio.com/")): &Link{
					Brand:       "",
					Description: "channel design",
					Href:        "https://www.feelsstudio.com/",
				},
			},
		},
	}

	for _, tt := range tests {
		links, err := parseVideoDescription(tt.video)
		if err != nil {
			t.Fatal(err)
		}

		for id, link := range tt.links {
			actual, ok := links[id]
			if !ok {
				err := fmt.Sprintf("link id not found : %s\nlink href: %s", id, link.Href)
				t.Fatal(err)
			}

			assert.Equal(t, link.Description, actual.Description)
			assert.Equal(t, link.Brand, actual.Brand)
			assert.Equal(t, link.Href, actual.Href)
		}
	}
}
