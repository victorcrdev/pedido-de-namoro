/* ============================================================
   PEDIDO DE NAMORO — script.js
   Organizado em pequenas responsabilidades:
   1. Correção de altura para Safari no iPhone
   2. Corações flutuando no fundo (decorativo)
   3. Lógica do botão "NÃO" fujão
   4. Transição para a tela de comemoração + partículas
   ============================================================ */

(function () {
  "use strict";

  /* --------------------------------------------------------
     1. ALTURA REAL DA TELA NO SAFARI / iOS
     100vh no Safari iOS inclui a barra de endereço, o que causa
     "pulos" de layout. Calculamos a altura real via JS e
     guardamos em --vh, usada no CSS como calc(var(--vh) * 100).
     -------------------------------------------------------- */
  function setViewportHeight() {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty("--vh", vh + "px");
  }
  setViewportHeight();
  window.addEventListener("resize", setViewportHeight);
  window.addEventListener("orientationchange", setViewportHeight);

  /* --------------------------------------------------------
     Referências dos elementos
     -------------------------------------------------------- */
  const askScreen = document.getElementById("askScreen");
  const yesScreen = document.getElementById("yesScreen");
  const btnYes = document.getElementById("btnYes");
  const btnNo = document.getElementById("btnNo");
  const tauntText = document.getElementById("tauntText");
  const floatingHearts = document.getElementById("floatingHearts");
  const celebrationParticles = document.getElementById("celebrationParticles");

  /* --------------------------------------------------------
     2. CORAÇÕES FLUTUANDO NO FUNDO (decorativo, discreto)
     -------------------------------------------------------- */
  function spawnBackgroundHearts(count) {
    for (let i = 0; i < count; i++) {
      const heart = document.createElement("span");
      heart.className = "floating-heart";
      heart.textContent = "❤";
      heart.style.left = Math.random() * 100 + "%";
      heart.style.setProperty("--drift", Math.random() * 60 - 30 + "px");
      heart.style.animationDuration = 9 + Math.random() * 8 + "s";
      heart.style.animationDelay = Math.random() * 10 + "s";
      heart.style.fontSize = 1 + Math.random() * 1.3 + "rem";
      floatingHearts.appendChild(heart);
    }
  }
  spawnBackgroundHearts(12);

  /* --------------------------------------------------------
     3. BOTÃO "NÃO" FUJÃO
     -------------------------------------------------------- */
  const phrases = [
    "Tem certeza? 🥺",
    "Pensa melhor...",
    "Não vale apertar aqui 😭",
    "Você não vai escapar do SIM ❤️",
    "Olha o outro botão 👀",
    "Essa opção não existe 😌",
    "Quase! Mas não 😅",
    "Tenta de novo... ou melhor, não tenta 😂",
    "O SIM tá logo ali ❤️",
    "Vai ser não a resposta? Duvido 👀",
  ];
  let lastPhraseIndex = -1;
  let attempts = 0;
  let isFleeing = false; // já saiu do fluxo normal e virou "position: fixed"
  let isMoving = false; // cooldown para não disparar vários movimentos ao mesmo tempo

  function pickPhrase() {
    let index;
    do {
      index = Math.floor(Math.random() * phrases.length);
    } while (index === lastPhraseIndex && phrases.length > 1);
    lastPhraseIndex = index;
    return phrases[index];
  }

  function showTaunt() {
    tauntText.textContent = pickPhrase();
  }

  // Calcula uma posição aleatória válida dentro da tela,
  // respeitando margens de segurança e a área do notch do iPhone.
  function getRandomPosition() {
    const margin = 14;
    const btnRect = btnNo.getBoundingClientRect();
    const width = btnRect.width || 120;
    const height = btnRect.height || 50;

    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;

    // reserva uma faixa no topo para não colidir com o cartão/texto
    const topReserve = Math.min(viewportH * 0.28, 160);

    const minX = margin;
    const maxX = Math.max(minX, viewportW - width - margin);
    const minY = topReserve;
    const maxY = Math.max(minY, viewportH - height - margin);

    const x = minX + Math.random() * (maxX - minX);
    const y = minY + Math.random() * (maxY - minY);

    return { x, y };
  }

  function activateFleeMode() {
    if (isFleeing) return;
    const rect = btnNo.getBoundingClientRect();
    // fixa o botão exatamente onde ele já está, sem "pulo" visual...
    btnNo.style.transition = "none";
    btnNo.style.left = rect.left + "px";
    btnNo.style.top = rect.top + "px";
    btnNo.classList.add("is-fleeing");
    // ...e só depois reativa a transição suave para os próximos movimentos
    requestAnimationFrame(() => {
      btnNo.style.transition = "";
    });
    isFleeing = true;
  }

  function fleeToNewPosition() {
    if (isMoving) return;
    isMoving = true;

    activateFleeMode();

    const { x, y } = getRandomPosition();
    btnNo.style.left = x + "px";
    btnNo.style.top = y + "px";

    attempts++;
    showTaunt();

    // depois de algumas tentativas, o botão fica um pouco menor
    // (sem sumir e sem virar impossível de ver/tocar)
    if (attempts === 4 || attempts === 8) {
      const currentScale = attempts === 4 ? 0.9 : 0.82;
      btnNo.style.transform = `scale(${currentScale})`;
    }

    // libera o cooldown depois que a transição termina
    window.setTimeout(() => {
      isMoving = false;
    }, 300);
  }

  // Clique/toque diretamente no botão: sempre foge, nunca "aceita" o não.
  function handleNoInteraction(event) {
    event.preventDefault();
    fleeToNewPosition();
  }
  btnNo.addEventListener("click", handleNoInteraction);
  btnNo.addEventListener("touchstart", handleNoInteraction, { passive: false });

  // Foge também quando o dedo/mouse apenas se aproxima, para o botão
  // parecer "vivo" e difícil de alcançar mesmo antes do toque.
  function distanceToButton(clientX, clientY) {
    const rect = btnNo.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = clientX - centerX;
    const dy = clientY - centerY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function handleProximity(clientX, clientY) {
    if (isMoving) return;
    // quanto mais tentativas, maior o raio de "fuga antecipada"
    const proximityThreshold = 70 + Math.min(attempts * 6, 40);
    if (distanceToButton(clientX, clientY) < proximityThreshold) {
      fleeToNewPosition();
    }
  }

  window.addEventListener(
    "touchmove",
    (event) => {
      const touch = event.touches[0];
      if (touch) handleProximity(touch.clientX, touch.clientY);
    },
    { passive: true }
  );

  window.addEventListener("mousemove", (event) => {
    handleProximity(event.clientX, event.clientY);
  });

  /* --------------------------------------------------------
     4. BOTÃO "SIM" — transição + comemoração
     -------------------------------------------------------- */
  function handleYes() {
    askScreen.classList.add("is-leaving");

    window.setTimeout(() => {
      yesScreen.setAttribute("aria-hidden", "false");
      yesScreen.classList.add("is-entering");
      spawnCelebration();
    }, 550);
  }
  btnYes.addEventListener("click", handleYes);

  function spawnCelebration() {
    const emojis = ["❤️", "💖", "💗", "✨"];
    const confettiColors = ["#d9b96a", "#f3c9c2", "#d98c9b", "#fff7f1"];
    const total = 26; // quantidade moderada para não pesar no celular

    for (let i = 0; i < total; i++) {
      window.setTimeout(() => spawnParticle(emojis, confettiColors), i * 60);
    }
  }

  function spawnParticle(emojis, confettiColors) {
    const particle = document.createElement("span");
    particle.className = "particle";

    const isHeart = Math.random() > 0.45;
    const duration = 3 + Math.random() * 2.5;
    const delay = Math.random() * 0.3;

    particle.style.left = Math.random() * 100 + "%";
    particle.style.animationDuration = duration + "s";
    particle.style.animationDelay = delay + "s";

    if (isHeart) {
      particle.textContent = emojis[Math.floor(Math.random() * emojis.length)];
      particle.style.fontSize = 1 + Math.random() * 1.2 + "rem";
    } else {
      // confete simples: quadradinho colorido
      particle.style.width = "8px";
      particle.style.height = "14px";
      particle.style.background =
        confettiColors[Math.floor(Math.random() * confettiColors.length)];
      particle.style.borderRadius = "2px";
    }

    celebrationParticles.appendChild(particle);

    // remove do DOM depois que a animação termina (mantém tudo leve)
    window.setTimeout(() => {
      particle.remove();
    }, (duration + delay) * 1000 + 100);
  }
})();
