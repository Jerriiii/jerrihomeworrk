let video;
let hands;
let camera;

let questions = [
  { question: "哪一個是「教育科技」的應用？", choices: ["線上課程", "汽車維修"], answer: 0 },
  { question: "哪個比較像是教育科技課程的主題？", choices: ["使用 VR 進行教學模擬", "歷史朝代年表背誦"], answer: 0 },
  { question: "哪一項屬於「數位學習」的特徵？", choices: ["可以隨時隨地學習", "只在教室面對老師學習"], answer: 0 },
  { question: "哪一個是「教育科技」的應用？", choices: ["用 AI 判斷學生學習進度", "只用粉筆寫黑板"], answer: 0 },
  { question: "「數位原生世代」的學生喜歡？", choices: ["被動聽講", "互動式學習"], answer: 1 },
  { question: "下列哪一種專案比較可能是教育科技系的成果？", choices: ["數位學習網站設計", "廚藝比賽規則訂定"], answer: 0 },
  { question: "教育科技系學生在課堂上最常做什麼？", choices: ["默寫唐詩三百首", "設計互動教學活動"], answer: 1 },
  { question: "如果你要設計一個線上課程，最需要先做什麼？", choices: ["規劃教學目標與流程", "先找背景音樂"], answer: 0 },
  { question: "哪一個活動最能展現教育科技系的特色？", choices: ["參加數學解題比賽", "設計數位學習遊戲"], answer: 1 },
  { question: "教育科技系學生最重視什麼能力？", choices: ["創意思考與科技應用", "純背誦知識內容"], answer: 0 }
];

let currentQuestionIndex = 0;
const optionWidth = 300;
const optionHeight = 100;
const gap = 100;
let choices = [{}, {}];
let highlightedChoice = -1;

let particles = [];
const particleCount = 20;
let isAnimating = false;

let lastPunchTime = 0;
const punchCooldown = 1000;
const nextQuestionDelay = 1500;

let glovePosX = 0;
let glovePosY = 0;

// 計分
let score = 0;

// 是否顯示總結視窗
let showSummary = false;

function setup() {
  createCanvas(windowWidth, windowHeight);

  video = createCapture(VIDEO);
  video.size(1280, 720);
  video.hide();

  hands = new Hands({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
  });

  hands.setOptions({
    maxNumHands: 1,
    modelComplexity: 1,
    minDetectionConfidence: 0.7,
    minTrackingConfidence: 0.7,
  });

  hands.onResults(onResults);

  camera = new Camera(video.elt, {
    onFrame: async () => {
      await hands.send({ image: video.elt });
    },
    width: 1280,
    height: 720
  });
  camera.start();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

class Particle {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.vx = (random() - 0.5) * 10;
    this.vy = (random() - 1.5) * 10;
    this.alpha = 255;
    this.type = type;
  }
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.5;
    this.alpha -= 5;
  }
  draw() {
    push();
    noStroke();
    tint(255, this.alpha);
    if (this.type === "coin") {
      fill(255, 215, 0);
      ellipse(this.x, this.y, 20);
      stroke(170, 136, 0);
      noFill();
      ellipse(this.x, this.y, 22);
    } else {
      fill(85);
      ellipse(this.x, this.y, 24);
    }
    pop();
  }
  isAlive() {
    return this.alpha > 0;
  }
}

function spawnParticles(x, y, type) {
  for (let i = 0; i < particleCount; i++) {
    particles.push(new Particle(x, y, type));
  }
}

function updateParticles() {
  particles = particles.filter(p => p.isAlive());
  for (let p of particles) {
    p.update();
    p.draw();
  }
}

function drawQuestion() {
  fill(255);
  stroke(0);
  strokeWeight(2);
  rect(20, 20, width - 40, 140, 20);

  fill(0);
  noStroke();
  textAlign(CENTER, TOP);
  textSize(36);
  text(questions[currentQuestionIndex].question, width / 2, 40);

  const totalWidth = optionWidth * 2 + gap;
  const startX = (width - totalWidth) / 2;
  const yPos = 100;

  textAlign(LEFT, CENTER);
  textSize(28);

  for (let i = 0; i < 2; i++) {
    let x = startX + i * (optionWidth + gap);

    fill(255, 215, 0, 220);
    stroke(0);
    strokeWeight(2);
    rect(x, yPos, optionWidth, optionHeight, 10);

    fill(0);
    noStroke();
    text(questions[currentQuestionIndex].choices[i], x + 20, yPos + optionHeight / 2);

    choices[i] = { x: x, y: yPos, w: optionWidth, h: optionHeight };
  }

  if (highlightedChoice >= 0) {
    noFill();
    stroke('lime');
    strokeWeight(5);
    let c = choices[highlightedChoice];
    rect(c.x, c.y, c.w, c.h, 10);
  }
}

function drawSummary() {
  push();
  fill(0, 180);
  rect(0, 0, width, height);

  fill(255);
  stroke(0);
  strokeWeight(3);
  rect(width / 2 - 250, height / 2 - 150, 500, 300, 20);

  noStroke();
  fill(0);
  textAlign(CENTER, CENTER);
  textSize(36);
  text("答題總結", width / 2, height / 2 - 90);

  textSize(28);
  text(`得分: ${score} / ${questions.length}`, width / 2, height / 2 - 30);

  // 再玩一次按鈕
  let btnX = width / 2 - 100;
  let btnY = height / 2 + 30;
  let btnW = 200;
  let btnH = 60;

  fill(255, 215, 0);
  stroke(0);
  strokeWeight(2);
  rect(btnX, btnY, btnW, btnH, 15);

  fill(0);
  noStroke();
  textSize(28);
  text("再玩一次", width / 2, btnY + btnH / 2);
  pop();

  // 紀錄按鈕區域以判斷點擊
  summaryButton = { x: btnX, y: btnY, w: btnW, h: btnH };
}

function mousePressed() {
  if (showSummary) {
    // 判斷是否點擊再玩一次按鈕
    if (
      mouseX >= summaryButton.x &&
      mouseX <= summaryButton.x + summaryButton.w &&
      mouseY >= summaryButton.y &&
      mouseY <= summaryButton.y + summaryButton.h
    ) {
      // 重置遊戲
      showSummary = false;
      currentQuestionIndex = 0;
      score = 0;
      highlightedChoice = -1;
      particles = [];
      isAnimating = false;
    }
  }
}

function checkAnswer(selectedIndex) {
  if (isAnimating) return;
  isAnimating = true;

  if (selectedIndex === questions[currentQuestionIndex].answer) {
    score++;
  }

  let c = choices[selectedIndex];
  let cx = c.x + c.w / 2;
  let cy = c.y + c.h / 2;

  spawnParticles(cx, cy, selectedIndex === questions[currentQuestionIndex].answer ? "coin" : "rock");

  setTimeout(() => {
    currentQuestionIndex++;
    if (currentQuestionIndex >= questions.length) {
      showSummary = true;
    }
    highlightedChoice = -1;
    isAnimating = false;
  }, nextQuestionDelay);
}

function isFistClosed(landmarks) {
  function isFingerBent(tip, pip) {
    return landmarks[tip].y > landmarks[pip].y;
  }
  return (
    isFingerBent(8, 6) &&
    isFingerBent(12, 10) &&
    isFingerBent(16, 14) &&
    isFingerBent(20, 18)
  );
}

function drawGlove(mediapipeX, mediapipeY) {
  push();
  translate(width - mediapipeX * width, mediapipeY * height);
  scale(2);

  let grad = drawingContext.createRadialGradient(0, 0, 10, 0, 0, 50);
  grad.addColorStop(0, "#ff5555");
  grad.addColorStop(1, "#880000");
  drawingContext.fillStyle = grad;

  noStroke();
  ellipse(0, 5, 80, 110);

  ellipse(-35, 10, 40, 50);

  fill(255);
  let knuckles = [
    [-20, -15],
    [0, -20],
    [20, -15],
  ];
  for (let [kx, ky] of knuckles) {
    ellipse(kx, ky, 24);
    stroke(187);
    strokeWeight(4);
    noFill();
  }

  pop();
}

function onResults(results) {
  background(50);

  // 顯示攝影機畫面，左右鏡像處理（翻轉）
  push();
  translate(width, 0);
  scale(-1, 1);
  image(video, 0, 0, width, height);
  pop();

  // 新增提示文字
  fill(255);
  noStroke();
  textAlign(CENTER, TOP);
  textSize(28);
  text("握拳戴上拳套，向上打擊選項回答！", width / 2, 10);

  if (!showSummary) {
    drawQuestion();
  } else {
    drawSummary();
  }

  updateParticles();

  if (showSummary) return;

  if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
    let landmarks = results.multiHandLandmarks[0];

    // 以手掌中心 landmark #9 作為拳套位置
    let palmX = landmarks[9].x;
    let palmY = landmarks[9].y;

    glovePosX = width - palmX * width;
    glovePosY = palmY * height;

    drawGlove(palmX, palmY);

    let now = millis();

    if (isFistClosed(landmarks)) {
      if (
        now - lastPunchTime > punchCooldown &&
        choices.some((c, i) => {
          if (
            glovePosX >= c.x && glovePosX <= c.x + c.w &&
            glovePosY >= c.y && glovePosY <= c.y + c.h
          ) {
            highlightedChoice = i;
            checkAnswer(i);
            lastPunchTime = now;
            return true;
          }
          return false;
        })
      ) {
        // 出拳選擇完成
      } else {
        highlightedChoice = -1;
      }
    } else {
      highlightedChoice = -1;
    }
  } else {
    highlightedChoice = -1;
  }
}
