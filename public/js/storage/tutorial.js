
console.log("[Tutorial] script loaded");

const KEY = "tutorialShown";

const tutorialSteps = [
  {
    title: "① 音を選んで再生",
    text: "好きな音を選んで、再生してみましょう。",
    progress: "1 / 3",
    icon: "play-circle",
    color: "#739E9B",
    bg: "#F0F6F1",
    border: "#D8E9DD"
  },
  {
    title: "② お気に入り保存",
    text: "気に入った音は、お気に入りに保存できます。",
    progress: "2 / 3",
    icon: "heart",
    color: "#D58CA3",
    bg: "#FBEFF3",
    border: "#F0D9E1"
  },
  {
    title: "③ ミックス作成",
    text: "複数の音を組み合わせて、自分だけの空間を作りましょう。",
    progress: "3 / 3",
    icon: "sliders-horizontal",
    color: "#9A89C2",
    bg: "#F2EFFA",
    border: "#E1DAF1"
  }
];

function initTutorial() {
  const overlay = document.getElementById("tutorialOverlay");
  const title = document.getElementById("tutorialTitle");
  const text = document.getElementById("tutorialText");
  const step = document.getElementById("tutorialStep");
  const progress = document.getElementById("tutorialProgress");
  const iconArea = document.getElementById("tutorialIcon");
  const dots = document.getElementById("tutorialDots");
  const backButton = document.getElementById("tutorialBack");
  const nextButton = document.getElementById("tutorialNext");
  const startButton = document.getElementById("tutorialStart");
  const skipButton = document.getElementById("tutorialSkip");

  if (
    !overlay || !title || !text || !step ||
    !progress || !iconArea || !dots ||
    !backButton || !nextButton || !startButton ||
    !skipButton
  ) {
    console.error(
      "[Tutorial] 必要なHTML要素が見つかりません。index.htmlを確認してください。"
    );
    return;
  }

  // -1 は「ようこそ！」画面
  let currentStep = -1;

  function closeTutorial() {
    overlay.classList.add("hidden");
    localStorage.setItem(KEY, "true");
  }

  function renderIcon(iconName, color, bg, border) {
    iconArea.style.setProperty("--tutorial-icon-color", color);
    iconArea.style.setProperty("--tutorial-icon-bg", bg);
    iconArea.style.setProperty("--tutorial-icon-border", border);

    iconArea.innerHTML = "";

    const iconElement = document.createElement("i");
    iconElement.setAttribute("data-lucide", iconName);
    iconArea.appendChild(iconElement);

    if (
      window.lucide &&
      typeof window.lucide.createIcons === "function"
    ) {
      window.lucide.createIcons({ root: iconArea });
    } else {
      console.error("[Tutorial] Lucideが読み込まれていません");
    }
  }

  function renderDots() {
    const dotElements = dots.querySelectorAll(".tutorial-dot");

    dotElements.forEach((dot, index) => {
      dot.classList.toggle("active", index === currentStep);
    });
  }

  function renderStep() {
    const isWelcome = currentStep === -1;
    const isLastStep =
      currentStep === tutorialSteps.length - 1;

    // 戻るボタンは最初の画面では表示しない
    backButton.classList.toggle("hidden", isWelcome);

    if (isWelcome) {
      title.textContent = "ようこそ！";
      text.textContent =
        "癒しの音を組み合わせて、あなただけの空間を作りましょう。";

      step.textContent = "";
      progress.textContent = "はじめに";

      renderIcon(
        "waves",
        "#7795B5",
        "#F0F4FA",
        "#DCE7F5"
      );

      dots.classList.add("hidden");
      nextButton.classList.remove("hidden");
      startButton.classList.add("hidden");
      return;
    }

    const data = tutorialSteps[currentStep];

    title.textContent = data.title;
    text.textContent = data.text;
    step.textContent = "";
    progress.textContent = data.progress;

    renderIcon(
      data.icon,
      data.color,
      data.bg,
      data.border
    );

    dots.classList.remove("hidden");
    renderDots();

    // 最後のステップでは「はじめる」を表示
    nextButton.classList.toggle("hidden", isLastStep);
    startButton.classList.toggle("hidden", !isLastStep);
  }

  // 次へ
  nextButton.addEventListener("click", () => {
    if (currentStep < tutorialSteps.length - 1) {
      currentStep++;
      renderStep();
    }
  });

  // 戻る
  backButton.addEventListener("click", () => {
    if (currentStep > -1) {
      currentStep--;
      renderStep();
    }
  });

  // スキップ
  skipButton.addEventListener("click", closeTutorial);

  // はじめる
  startButton.addEventListener("click", closeTutorial);

  if (localStorage.getItem(KEY) === "true") {
    overlay.classList.add("hidden");
    return;
  }

  overlay.classList.remove("hidden");
  renderStep();
}

function startTutorialSafely() {
  initTutorial();
}

if (document.readyState === "loading") {
  document.addEventListener(
    "DOMContentLoaded",
    startTutorialSafely,
    { once: true }
  );
} else {
  startTutorialSafely();
}