import p5 from 'p5';

export class ShapeMorphing {
  private p!: p5;
  private lastTime: number = 0;
  private interval: number = 2000; // 2秒間隔
  private currentShape: any = null;
  private targetShape: any = null;
  private morphProgress: number = 0;
  private morphSpeed: number = 0.08; // モーフィング速度

  constructor() {
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

    // 2秒ごとに新しい形を生成
    if (this.p.millis() - this.lastTime >= this.interval) {
      this.lastTime = this.p.millis();
      this.currentShape = this.targetShape; // 現在の形を保存
      this.targetShape = this.generateNewShape(); // 新しい目標形を生成
      this.morphProgress = 0; // モーフィングをリセット
    }

    // モーフィング中または初期化
    if (this.targetShape) {
      if (!this.currentShape) {
        this.currentShape = this.targetShape;
      }

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
    } else {
      // 初期化時に最初の形を描画
      if (!this.targetShape) {
        this.targetShape = this.generateNewShape();
        this.currentShape = this.targetShape;
      }
    }
  }

  // 新しい形を生成する関数
  private generateNewShape(): any {
    const centerX = this.p.width / 2;
    const centerY = this.p.height / 2;
    const size = this.p.random(150, 180);
    const numShapes = this.p.floor(this.p.random(1, 5));

    const shapes = [];
    for (let i = 0; i < numShapes; i++) {
      const shape = {
        x: centerX + this.p.random(-size / 2, size / 2),
        y: centerY + this.p.random(-size / 2, size / 2),
        rotation: this.p.random(this.p.TWO_PI),
        size: this.p.random(size * 0.9, size * 0.9),
        vertices: this.generateVertices(
          this.p.random(3, 10),
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
    this.p.fill("#4C74B9");
    this.p.noStroke();

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
      this.p.pop();
    }
  }
}
