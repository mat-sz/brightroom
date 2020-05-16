import Brightroom from '../.';
import example from './example.jpg';

new Brightroom({
  image: example,
  container: document.getElementById('root')!
});
