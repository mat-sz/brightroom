import ExifReader from 'exifreader';

import styles from './brightroom.module.scss';

export interface BrightroomOptions {
  /**
   * Input image, can be either a Blob (File), data/blob URL or same-origin (or acceptable origin) URL.
   */
  image?: Blob | string;

  /**
   * Container element.
   */
  container?: HTMLElement;
}

enum BrightroomRotation {
  ROTATION_0 = 0,
  ROTATION_90 = 90,
  ROTATION_180 = 180,
  ROTATION_270 = 270
}

export default class Brightroom {
  private canvas = document.createElement('canvas');
  private controls = document.createElement('div');
  private currentContainer: HTMLElement | undefined;
  private currentImage: HTMLImageElement | undefined;
  private rotation: BrightroomRotation = BrightroomRotation.ROTATION_0;
  private flipH = false;
  private flipV = false;

  /**
   * Hi-DPI scale.
   */
  private scale = 2;

  constructor({ image, container }: BrightroomOptions) {
    this.draw = this.draw.bind(this);
    this.buildControls();

    if (container) {
      this.mount(container);
    }

    if (image) {
      this.setImage(image);
    }
  }

  mount(container: HTMLElement) {
    if (container === this.currentContainer) {
      // No need to remount.
      return;
    }

    this.unmount();

    if (container.hasAttribute('data-brightroom')) {
      throw new Error('Brightroom is already mounted in this container.');
    }

    container.appendChild(this.canvas);
    container.appendChild(this.controls);

    container.setAttribute('data-brightroom', '1');
    container.classList.add(styles.container);
    this.currentContainer = container;

    this.resize();
  }

  unmount() {
    if (this.currentContainer) {
      this.currentContainer.removeChild(this.canvas);
      this.currentContainer.removeChild(this.controls);

      this.currentContainer.removeAttribute('data-brightroom');
      this.currentContainer.classList.remove(styles.container);
    }

    this.currentContainer = undefined;
  }

  async setImage(image: Blob | string) {
    let data: ArrayBuffer;

    if (typeof image === 'string') {
      // Make sure the URL comes from a valid source.
      const res = await fetch(image);

      if (
        !res.ok ||
        ('Content-Type' in res.headers &&
          !(res.headers['Content-Type'] as string).startsWith('image/'))
      ) {
        throw new Error('Unable to load image from URL: ' + image);
      }

      // No exception will be thrown if the origin is valid.
      data = await res.arrayBuffer();
    } else if (image instanceof Blob) {
      data = await new Response(image).arrayBuffer();
    } else {
      throw new Error('Unsupported input type.');
    }

    // Read EXIF tags.
    const tags = ExifReader.load(data);
    if (tags.Orientation) {
      // TODO: Rotate the image.
    }

    this.currentImage = new Image();
    this.currentImage.addEventListener('load', () => {
      this.resize();
    });
    this.currentImage.src = URL.createObjectURL(new Blob([data]));

    this.resize();
  }

  get loaded() {
    return (
      this.currentImage instanceof HTMLImageElement &&
      this.currentImage.complete &&
      this.currentImage.naturalWidth !== 0
    );
  }

  rotate(rotation: BrightroomRotation) {
    this.rotation = rotation;

    this.resize();
  }

  async toCanvas() {
    const canvas = document.createElement('canvas');

    if (!this.currentImage || !this.loaded) {
      throw new Error('Image is not loaded.');
    }

    const { naturalWidth, naturalHeight } = this.currentImage;
    if (
      this.rotation == BrightroomRotation.ROTATION_0 ||
      this.rotation === BrightroomRotation.ROTATION_180
    ) {
      canvas.height = naturalHeight;
      canvas.width = naturalWidth;
    } else {
      canvas.height = naturalWidth;
      canvas.width = naturalHeight;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Context initialization failure.');
    }

    ctx.save();

    if (this.flipV) {
      ctx.translate(0, canvas.height);
      ctx.scale(1, -1);
    }

    if (this.flipH) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((this.rotation * Math.PI) / 180);
    ctx.drawImage(this.currentImage, -naturalWidth / 2, -naturalHeight / 2);

    ctx.restore();

    return canvas;
  }

  private updateTransform() {
    this.canvas.style.transform =
      'rotateX(' +
      (this.flipV ? '180deg' : '0') +
      ') rotateY(' +
      (this.flipH ? '180deg' : '0') +
      ') rotateZ(' +
      this.rotation +
      'deg) scale3d(' +
      1 / this.scale +
      ', ' +
      1 / this.scale +
      ', 1)';
  }

  private resize() {
    if (!this.currentContainer) {
      return;
    }

    const computedStyle = window.getComputedStyle(this.currentContainer);

    const maxWidth = (parseFloat(computedStyle.width) - 100) * this.scale;
    const maxHeight = (parseFloat(computedStyle.height) - 100) * this.scale;

    if (this.currentImage && this.loaded) {
      const { naturalWidth, naturalHeight } = this.currentImage;

      let scale = 1;
      if (
        this.rotation == BrightroomRotation.ROTATION_0 ||
        this.rotation === BrightroomRotation.ROTATION_180
      ) {
        scale = Math.min(
          Math.min(maxWidth / naturalWidth, maxHeight / naturalHeight),
          1
        );
      } else {
        scale = Math.min(
          Math.min(maxHeight / naturalWidth, maxWidth / naturalHeight),
          1
        );
      }

      this.canvas.height = naturalHeight * scale;
      this.canvas.width = naturalWidth * scale;
    } else {
      this.canvas.width = 0;
      this.canvas.height = 0;
    }

    this.canvas.style.width = this.canvas.width + 'px';
    this.canvas.style.height = this.canvas.height + 'px';

    this.updateTransform();
    requestAnimationFrame(this.draw);
  }

  private draw() {
    if (!this.currentContainer) {
      return;
    }

    const ctx = this.canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    const { width, height } = this.canvas;
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, width, height);

    if (this.currentImage && this.loaded) {
      ctx.drawImage(this.currentImage, 0, 0, width, height);
    } else {
      ctx.fillStyle = 'white';
      ctx.fillText('Loading...', 50, 50);
    }
  }

  private selectTab(tab: string) {
    this.controls.classList.remove(
      ...Object.keys(styles)
        .filter(key => key.startsWith('tab_active_'))
        .map(key => styles[key])
    );
    this.controls.classList.add(styles['tab_active_' + tab]);
  }

  private buildControls() {
    this.controls.classList.add(styles.controls);

    // Tabs
    const tabBtnContainer = document.createElement('div');
    tabBtnContainer.classList.add(styles.tabs);

    const transformTabBtn = document.createElement('button');
    transformTabBtn.innerText = 'Transform';
    transformTabBtn.addEventListener('click', () =>
      this.selectTab('transform')
    );
    tabBtnContainer.appendChild(transformTabBtn);

    this.controls.appendChild(tabBtnContainer);

    // Transform tab
    const transformTab = document.createElement('div');
    transformTab.classList.add(styles.tab, styles.tab_transform);

    const rotateBtn = document.createElement('button');
    rotateBtn.innerText = 'Rotate';
    rotateBtn.addEventListener('click', () => {
      switch (this.rotation) {
        case BrightroomRotation.ROTATION_0:
          this.rotate(BrightroomRotation.ROTATION_90);
          break;
        case BrightroomRotation.ROTATION_90:
          this.rotate(BrightroomRotation.ROTATION_180);
          break;
        case BrightroomRotation.ROTATION_180:
          this.rotate(BrightroomRotation.ROTATION_270);
          break;
        default:
          this.rotate(BrightroomRotation.ROTATION_0);
          break;
      }
    });
    transformTab.appendChild(rotateBtn);

    const flipVBtn = document.createElement('button');
    flipVBtn.innerText = 'Flip V';
    flipVBtn.addEventListener('click', () => {
      this.flipV = !this.flipV;
      this.resize();
    });
    transformTab.appendChild(flipVBtn);

    const flipHBtn = document.createElement('button');
    flipHBtn.innerText = 'Flip H';
    flipHBtn.addEventListener('click', () => {
      this.flipH = !this.flipH;
      this.resize();
    });
    transformTab.appendChild(flipHBtn);

    this.controls.appendChild(transformTab);
  }
}
