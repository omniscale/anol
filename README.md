Welcome to AnOl
===============

AnOl is a small framework to create a maps with AngularJS, OpenLayers3 and Bootstrap. There is no official releases yet.

It is developed and supported by Omniscale and is released as open source under the MIT License

Get Started
-----------

**(1)** Load AnOl

    - clone this repository

**(2)** Install dependencies

    - npm install

**(3)** Build AnOl

    - grunt build-full

**(4)** Use AnOl

    - Copy files from `build` directory in your project and include them in your `index.html`

**(5)** Start dev server

	- grunt dev

A dev server on port 7000 startet. Now you can open the examples on http://localhost:7000/examples/.

Build notes
------------

If you build AnOl with `grunt build-full` all javascript dependencies are included in built `anol.min.js`.

If you want to include the dependencies by your own, run `grunt build` instead.

To create a debug version run `grunt build-debug`.

To create AnOl API documentation run `grunt build-doc`. The API is created and can be found under `docs/`. You might need to run a webserver like `python -m SimpleHTTPServer` in `docs` folder to see the API documentation correct.