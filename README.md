# Brightroom

Embeddable image editor for the modern web (TypeScript). [NPM](http://npmjs.com/package/brightroom)

## Installation

### NPM/Yarn

Brightroom can be installed by using either yarn or npm:

```
yarn add brightroom
// ...or
npm install brightroom
```

Then it can be included in a project using ES import statements:

```js
// Important! Don't forget the CSS.
import 'brightroom/dist/brightroom.esm.css';
import Brightroom from 'brightroom';
```

### Unpkg

```html
<link
  rel="stylesheet"
  href="https://unpkg.com/brightroom/dist/brightroom.cjs.production.min.css"
/>
<script src="https://unpkg.com/brightroom/dist/brightroom.cjs.production.min.js"></script>
```

### Hosting

The files necessary for self-hosting can be found in the [dist](https://github.com/mat-sz/brightroom/tree/master/dist) directory. For non ESM projects, the CJS version (brightroom.cjs.production.min.js) will be the right one.

## Usage

Brightroom needs to be mounted to a container element. It will detect and adapt itself to the parent element's height and width. Setting an explicit size on the container element is recommended.

```js
import 'brightroom/dist/brightroom.esm.css';
import Brightroom from 'brightroom';

const brightroom = new Brightroom({
  image: './example.jpg',
  container: document.getElementById('root')!
});

// Setting initial options is not required, in fact Brightroom has an API.
brightroom.setImage('image.png');
brightroom.unmount();
brightroom.mount(document.getElementById('newContainer')!);
```
