# AnOl

#### Framework to create a cool map with AngularJS, Bootstrap and OpenLayers3

## Get Started

**(1)** Get AnOl

    - clone this repository

**(2)** Install dependencies

    - npm install

**(3)** Build AnOl

    - grunt build-full

**(4)** Use AnOl

    - Copy files from `build` directory in your project and include them in your `index.html`

## Build notes

If you build AnOl with `grunt build-full` all javascript dependencies are included in built `anol.min.js`.

If you want to include the dependencies by your own, run `grunt build` instead.

If you want a debug version of AnOl run `grunt build-debug`.

To create AnOl API documentation run `grunt build-doc`. The API is created and can be found under `docs/`. You might need to run a webserver like `python -m SimpleHTTPServer` in `docs` folder to see the API documentation correct.
