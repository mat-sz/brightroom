import Brightroom from '../.';
import example from './example.jpg';

const brightroom = new Brightroom({
  image: example,
  container: document.getElementById('root')!
});

const exportBtn = document.getElementById('export');
if (exportBtn) {
  exportBtn.addEventListener('click', async () => {
    const canvas: HTMLCanvasElement = await brightroom.toCanvas();
    window.open(canvas.toDataURL(), '_blank');
  });
}
