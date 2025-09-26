import p5 from 'p5';
import { Tweakable } from './Tweakable';

export class ShapeMorphing extends Tweakable {
  private p!: p5;
  private lastTime: number = 0;
  private currentShape: any = null;
  private targetShape: any = null;
  private morphProgress: number = 0;
  
  // Tweakableパラメーター
  public interval: number = 2000; // 2秒間隔
  public morphSpeed: number = 0.3; // モーフィング速度
  public numShapes: number = 8; // 生成する形の最大数
  public minVertices: number = 3; // 最小頂点数
  public maxVertices: number = 8; // 最大頂点数
  public minSize: number = 80; // 最小サイズ
  public maxSize: number = 220; // 最大サイズ
  public strokeWeight: number = 1.6; // 線の太さ
  public keyColor: string = '#4C74B9'; // 色
  public showVertices: boolean = false; // 頂点を強調表示するか
  public vertexSize: number = 6; // 頂点のサイズ
  public vertexColor: string = '#FF6B6B'; // 頂点の色
  public outlineOnly: boolean = false; // アウトラインのみ表示するか
  public cycleDrawMode: boolean = true; // 描画モードを順番に切り替えるか
  public currentDrawMode: number = 0; // 現在の描画モード (0: 塗り, 1: アウトライン, 2: アウトライン+頂点)
  private drawModeCycle: number = 0; // 描画モードのサイクルカウンター

  constructor() {
    super(); // Tweakableのコンストラクターを呼び出し
    
    // Tweakableパラメーターを設定
    this.setupTweakableParams();
    this.pane.element.style.display = 'none';
    
    // キーボードイベントリスナーを設定
    this.setupKeyboardControls();
    
    const canvasContainer = document.getElementById("p5-canvas");
    if (canvasContainer) {
      new p5((p: p5) => {
        this.p = p;
        
        p.setup = () => {
          this.setup();
        };
        
        p.draw = () => {
          this.draw();
        };
      }, canvasContainer);
    }
  }

  private setupKeyboardControls() {
    document.addEventListener('keydown', (event) => {
      if (event.key === '\\' || event.key === '¥') {
        event.preventDefault();
        this.toggleTweakable();
      }
    });
  }

  private toggleTweakable() {
    const element = this.pane.element;
    if (element.style.display === 'none') {
      element.style.display = 'block';
    } else {
      element.style.display = 'none';
    }
  }

  private setupTweakableParams() {
    // 各パラメーターをTweakableに追加
    this.setupProp('interval', { min: 500, max: 5000, step: 100 });
    this.setupProp('morphSpeed', { min: 0.01, max: 1.0, step: 0.01 });
    this.setupProp('numShapes', { min: 1, max: 10, step: 1 });
    this.setupProp('minVertices', { min: 3, max: 20, step: 1 });
    this.setupProp('maxVertices', { min: 3, max: 20, step: 1 });
    this.setupProp('minSize', { min: 10, max: 300, step: 10 });
    this.setupProp('maxSize', { min: 10, max: 300, step: 10 });
    this.setupProp('strokeWeight', { min: 0, max: 10, step: 0.5 });
    this.setupProp('keyColor');
    
    // 頂点強調モードのパラメーター
    this.setupProp('showVertices');
    this.setupProp('vertexSize', { min: 2, max: 20, step: 1 });
    this.setupProp('vertexColor');
    
    // アウトライン表示モードのパラメーター
    this.setupProp('outlineOnly');
    
    // 描画モードのパラメーター
    this.setupProp('cycleDrawMode');
    this.setupProp('currentDrawMode', { min: 0, max: 2, step: 1 });
    
  }

  private setup(): void {
    // ピクセル密度を1に固定（高解像度ディスプレイ対策）
    
    // キャンバスを作成
    this.p.createCanvas(600, 600);

    // 最初の形を生成
    this.targetShape = this.generateNewShape();
  }


  private draw(): void {
    // 完全にクリア
    this.p.clear();
    this.p.background(0, 0, 0, 0);

    // 初期化時の即座描画
    if (!this.currentShape && this.targetShape) {
      this.currentShape = this.targetShape;
      this.drawMorphedShape(this.currentShape);
      return;
    }

    // 指定された間隔で新しい形を生成
    if (this.p.millis() - this.lastTime >= this.interval) {
      this.lastTime = this.p.millis();
      this.currentShape = this.targetShape; // 現在の形を保存
      this.targetShape = this.generateNewShape(); // 新しい目標形を生成
      this.morphProgress = 0; // モーフィングをリセット
      
      // 描画モードを順番に切り替え（塗り3回、アウトライン+頂点1回）
      if (this.cycleDrawMode) {
        this.drawModeCycle = (this.drawModeCycle + 1) % 4; // 0, 1, 2, 3を繰り返す
        if (this.drawModeCycle < 3) {
          this.currentDrawMode = 0; // 塗りのみ
        } else {
          this.currentDrawMode = 2; // アウトライン+頂点
        }
      }
    }

    // モーフィング中
    if (this.targetShape && this.currentShape) {
      // モーフィング進行
      this.morphProgress += this.morphSpeed;
      if (this.morphProgress > 1) this.morphProgress = 1;

      // イージングを適用
      const easedProgress = this.easeInOutCubic(this.morphProgress);

      // 現在の形と目標形の間を補間
      const morphedShape = this.morphShapes(
        this.currentShape,
        this.targetShape,
        easedProgress
      );
      this.drawMorphedShape(morphedShape);
    }
  }

  // 新しい形を生成する関数
  private generateNewShape(): any {
    const centerX = this.p.width / 2;
    const centerY = this.p.height / 2;
    const size = this.p.random(this.minSize, this.maxSize);
    const numShapes = this.p.floor(this.p.random(1, this.numShapes + 1));

    const shapes = [];
    for (let i = 0; i < numShapes; i++) {
      const shape = {
        x: centerX + this.p.random(-size / 2, size / 2),
        y: centerY + this.p.random(-size / 2, size / 2),
        rotation: this.p.random(this.p.TWO_PI),
        size: this.p.random(size * 0.9, size * 0.9),
        vertices: this.generateVertices(
          this.p.random(this.minVertices, this.maxVertices + 1),
          this.p.random(size * 0.9, size * 0.9)
        ),
      };
      shapes.push(shape);
    }
    return shapes;
  }

  // 頂点を生成する関数（順序を保持）
  private generateVertices(numVertices: number, size: number): any {
    const vertices = [];

    // 基準となる角度を生成（時計回り）
    const baseAngles = [];
    for (let i = 0; i < numVertices; i++) {
      baseAngles.push((this.p.TWO_PI / numVertices) * i);
    }

    // 各頂点を順序を保って生成
    for (let i = 0; i < numVertices; i++) {
      const angle = baseAngles[i] + this.p.random(-0.2, 0.2); // 角度の変動を小さく
      const radius = size * this.p.random(0.6, 1.0); // 半径の変動を小さく
      const x =
        this.p.cos(angle) * radius + this.p.random(-size * 0.05, size * 0.05);
      const y =
        this.p.sin(angle) * radius + this.p.random(-size * 0.05, size * 0.05);
      vertices.push({ x, y });
    }

    return vertices;
  }

  // 形をモーフィングする関数
  private morphShapes(
    currentShapes: any,
    targetShapes: any,
    progress: number
  ): any {
    const morphedShapes = [];
    const maxShapes = this.p.max(currentShapes.length, targetShapes.length);

    for (let i = 0; i < maxShapes; i++) {
      const current = currentShapes[i] || currentShapes[0];
      const target = targetShapes[i] || targetShapes[0];

      const morphedShape = {
        x: this.p.lerp(current.x, target.x, progress),
        y: this.p.lerp(current.y, target.y, progress),
        rotation: this.p.lerp(current.rotation, target.rotation, progress),
        size: this.p.lerp(current.size, target.size, progress),
        vertices: this.morphVertices(
          current.vertices,
          target.vertices,
          progress
        ),
      };
      morphedShapes.push(morphedShape);
    }
    return morphedShapes;
  }

  // 頂点をモーフィングする関数（ねじれ防止）
  private morphVertices(
    currentVertices: any,
    targetVertices: any,
    progress: number
  ): any {
    const morphedVertices = [];

    // 頂点数を統一（少ない方に合わせる）
    const minVertices = this.p.min(
      currentVertices.length,
      targetVertices.length
    );

    for (let i = 0; i < minVertices; i++) {
      const current = currentVertices[i];
      const target = targetVertices[i];

      morphedVertices.push({
        x: this.p.lerp(current.x, target.x, progress),
        y: this.p.lerp(current.y, target.y, progress),
      });
    }

    // 余った頂点は最後の頂点に合わせる
    if (currentVertices.length > minVertices) {
      for (let i = minVertices; i < currentVertices.length; i++) {
        const current = currentVertices[i];
        const lastTarget = targetVertices[targetVertices.length - 1];

        morphedVertices.push({
          x: this.p.lerp(current.x, lastTarget.x, progress),
          y: this.p.lerp(current.y, lastTarget.y, progress),
        });
      }
    } else if (targetVertices.length > minVertices) {
      for (let i = minVertices; i < targetVertices.length; i++) {
        const lastCurrent = currentVertices[currentVertices.length - 1];
        const target = targetVertices[i];

        morphedVertices.push({
          x: this.p.lerp(lastCurrent.x, target.x, progress),
          y: this.p.lerp(lastCurrent.y, target.y, progress),
        });
      }
    }

    return morphedVertices;
  }

  // イージング関数
  private easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  private easeInOutQuad(t: number): number {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  private easeInOutSine(t: number): number {
    return -(Math.cos(Math.PI * t) - 1) / 2;
  }

  // モーフィングされた形を描画する関数
  private drawMorphedShape(shapes: any): void {
    // 描画モードに基づいて設定
    this.setDrawMode();

    for (let shape of shapes) {
      this.p.push();
      this.p.translate(shape.x, shape.y);
      this.p.rotate(shape.rotation);

      this.p.beginShape();
      const vertices = shape.vertices;

      // splineVertexを使用して滑らかな曲線を作成
      if (vertices.length > 0) {
        for (let vertex of vertices) {
          (this.p as any).splineVertex(vertex.x, vertex.y);
        }
      }
      this.p.endShape(this.p.CLOSE);

      // 頂点を強調表示（描画モードに基づく）
      if (this.shouldShowVertices()) {
        this.drawVertices(vertices);
      }

      this.p.pop();
    }
  }

  // 頂点を描画する関数
  private drawVertices(vertices: any[]): void {
    this.p.fill(this.vertexColor);
    this.p.noStroke();
    
    for (let vertex of vertices) {
      this.p.ellipse(vertex.x, vertex.y, this.vertexSize, this.vertexSize);
    }
  }

  // 描画モードを設定する関数
  private setDrawMode(): void {
    if (this.cycleDrawMode) {
      // サイクル描画モードが有効な場合、currentDrawModeに基づく
      switch (this.currentDrawMode) {
        case 0: // 塗りのみ
          this.p.fill(this.keyColor);
          this.p.noStroke();
          break;
        case 1: // アウトラインのみ
          this.p.noFill();
          this.p.strokeWeight(this.strokeWeight);
          this.p.stroke(this.keyColor);
          break;
        case 2: // アウトライン+頂点
          this.p.noFill();
          this.p.strokeWeight(this.strokeWeight);
          this.p.stroke(this.keyColor);
          break;
      }
    } else {
      // サイクル描画モードが無効な場合、従来の設定を使用
      if (this.outlineOnly) {
        this.p.noFill();
        this.p.strokeWeight(this.strokeWeight);
        this.p.stroke(this.keyColor);
      } else {
        this.p.fill(this.keyColor);
        this.p.strokeWeight(this.strokeWeight);
        this.p.stroke(this.keyColor);
      }
    }
  }

  // 頂点を表示するかどうかを判定する関数
  private shouldShowVertices(): boolean {
    if (this.cycleDrawMode) {
      // サイクル描画モードが有効な場合、currentDrawModeが2の時のみ頂点を表示
      return this.currentDrawMode === 2;
    } else {
      // サイクル描画モードが無効な場合、従来の設定を使用
      return this.showVertices;
    }
  }
}
