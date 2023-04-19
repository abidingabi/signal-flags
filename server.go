package main

import (
	"bytes"
	"embed"
	"fmt"
	"image"
	"image/color"
	"image/draw"
	"image/png"
	"io"
	"net/http"
	"net/url"
	"os"
	"regexp"
	"strconv"
	"strings"
)

const BASE_FLAG_WIDTH = 1500
const BASE_FLAG_HEIGHT = 1000

// see main.js for why the colors are what they are
var STRIPE_TO_LETTER = map[rune]Stripe{
	'l': Stripe{hexCodeToColor("#D62900"), 7},
	'e': Stripe{hexCodeToColor("#F07722"), 7},
	's': Stripe{hexCodeToColor("#FF9B55"), 7},
	'b': Stripe{hexCodeToColor("#FFFFFF"), 7},
	'i': Stripe{hexCodeToColor("#D262A6"), 7},
	'a': Stripe{hexCodeToColor("#B75591"), 7},
	'n': Stripe{hexCodeToColor("#A50062"), 7},
	'y': Stripe{hexCodeToColor("#282828"), 4},
	'p': Stripe{hexCodeToColor("#FF1C8D"), 3},
	'f': Stripe{hexCodeToColor("#FE76A2"), 5},
	'u': Stripe{hexCodeToColor("#BF12D7"), 5},
	'd': Stripe{hexCodeToColor("#303CBE"), 5},
	't': Stripe{hexCodeToColor("#5BCFFB"), 5},
	'r': Stripe{hexCodeToColor("#F5ABB9"), 5},
	'm': Stripe{hexCodeToColor("#9AD9EB"), 5},
	'o': Stripe{hexCodeToColor("#C4C4C4"), 5},
	'c': Stripe{hexCodeToColor("#FCA9A3"), 5},
	'v': Stripe{hexCodeToColor("#078D70"), 5},
}

// assumes "#000000" format, will break otherwise
func hexCodeToColor(hexcode string) color.Color {
	r, _ := strconv.ParseUint(hexcode[1:3], 16, 8)
	g, _ := strconv.ParseUint(hexcode[3:5], 16, 8)
	b, _ := strconv.ParseUint(hexcode[5:7], 16, 8)

	return color.RGBA{uint8(r), uint8(g), uint8(b), 255}
}

type Stripe struct {
	Color          color.Color
	StripesPerFlag int
}

func (stripe Stripe) Width() int {
	return int(float64(BASE_FLAG_HEIGHT) / float64(stripe.StripesPerFlag))
}

func DrawStripe(im *image.RGBA, stripe Stripe, startingHeight int) {
	draw.Draw(
		im,
		image.Rect(
			0,
			startingHeight,
			im.Bounds().Max.X,
			startingHeight+stripe.Width(),
		),
		&image.Uniform{stripe.Color},
		image.ZP,
		draw.Src,
	)
}

func CreateFlag(stripes []Stripe) *image.RGBA {
	flagHeight := 0
	for _, stripe := range stripes {
		flagHeight += stripe.Width()
	}

	im := image.NewRGBA(image.Rect(0, 0, BASE_FLAG_WIDTH, flagHeight))

	startingHeight := 0
	for _, stripe := range stripes {
		DrawStripe(im, stripe, startingHeight)

		startingHeight += stripe.Width()
	}

	return im
}

func Generate(w http.ResponseWriter, r *http.Request) {
	path := r.URL.Path
	input := strings.ToLower(path[10 : len(path)-4])

	stripes := make([]Stripe, len(input))

	for i, runeValue := range input {
		stripe, exists := STRIPE_TO_LETTER[runeValue]

		if !exists {
			w.Header().Add("Content-Type", "text/plain")
			io.WriteString(w, "Invalid character used")
			return
		}

		stripes[i] = stripe
	}

	w.Header().Add("Content-Type", "image/png")
	png.Encode(w, CreateFlag(stripes))
}

//go:embed static
var staticContent embed.FS

func ServeFileTransform(
	mime string,
	path string,
	transform func(input []byte, urlQuery url.Values) []byte,
) func(w http.ResponseWriter, r *http.Request) {
	b, err := staticContent.ReadFile(path)

	if err != nil {
		panic(err)
	}

	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Add("Content-Type", mime)
		w.Write(transform(b, r.URL.Query()))
	}
}

func ServeFile(mime string, path string) func(w http.ResponseWriter, r *http.Request) {
	return ServeFileTransform(
		mime,
		path,
		func(input []byte, urlQuery url.Values) []byte {
			return input
		},
	)
}

type Route struct {
	regexp  *regexp.Regexp
	handler http.HandlerFunc
}

func makeRoute(pattern string, handler http.HandlerFunc) Route {
	return Route{regexp.MustCompile("^" + pattern + "$"), handler}
}

var routes = []Route{
	makeRoute("/generate/\\w+.png", Generate),
	makeRoute("/style.css", ServeFile("text/css", "static/style.css")),
	makeRoute("/main.js", ServeFile("text/javascript", "static/main.js")),
	makeRoute("/", ServeFileTransform(
		"text/html",
		"static/index.html",
		func(input []byte, urlQuery url.Values) []byte {
			var queryParams = urlQuery["input"]
			if len(queryParams) == 0 || len(queryParams[0]) == 0 {
				return input
			}

			return bytes.Replace(
				input,
				[]byte("replaceme"),
				[]byte(queryParams[0]+".png"),
				1,
			)
		},
	)),
}

type CustomHandler struct{}

func (h CustomHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	for _, route := range routes {
		matches := route.regexp.MatchString(r.URL.Path)

		if matches {
			route.handler(w, r)
			return
		}
	}

	w.Header().Add("Content-Type", "text/plain")
	http.Error(w, "Invalid path!", 404)
}

func main() {
	if len(os.Args) != 2 {
		fmt.Println("The port to bind to must be specified as the only parameter.")
		return
	}

	err := http.ListenAndServe(":"+os.Args[1], new(CustomHandler))
	fmt.Println(err)
}
