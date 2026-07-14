(() => {
  const input = document.getElementById("chat-input");
  const analyzeBtn = document.getElementById("analyze-btn");
  const clearBtn = document.getElementById("clear-btn");
  const results = document.getElementById("results");
  const scoreNumber = document.getElementById("score-number");
  const verdictEl = document.getElementById("verdict");
  const breakdownEl = document.getElementById("breakdown");
  const meterFill = document.getElementById("meter-fill");
  const meterNeedle = document.getElementById("meter-needle");

  /** @type {{ pattern: RegExp; weight: number; label: string }[]} */
  const SIGNAL_LEXICON = [
    { pattern: /\b(slay|slayed|slaying)\b/gi, weight: 8, label: "slay" },
    { pattern: /\b(yas+|yaas+)\b/gi, weight: 7, label: "yas" },
    { pattern: /\b(queen|king|diva|icon)\b/gi, weight: 6, label: "royalty talk" },
    { pattern: /\b(tea|spilling|spill the tea)\b/gi, weight: 6, label: "tea" },
    { pattern: /\b(werk|werq|work\.?)\b/gi, weight: 7, label: "werk" },
    { pattern: /\b(serving|served|serve)\b/gi, weight: 5, label: "serving" },
    { pattern: /\b(hunty|hun+|bestie|sis|girl+e?)\b/gi, weight: 5, label: "address" },
    { pattern: /\b(periodt?|and i oop)\b/gi, weight: 8, label: "periodt" },
    { pattern: /\b(kiki|shade|read(?:ing)?|clock(?:ed|ing)?)\b/gi, weight: 6, label: "shade lexicon" },
    { pattern: /\b(gag(?:ged)?|ate|devour(?:ed)?)\b/gi, weight: 6, label: "reaction language" },
    { pattern: /\b(camp|campy|iconic)\b/gi, weight: 5, label: "camp" },
    { pattern: /\b(drag|ru|rupauls?|snatch\s*game)\b/gi, weight: 9, label: "drag refs" },
    { pattern: /\b(pride|queer|gay|bi|lesbian|lgbtq?\+?)\b/gi, weight: 7, label: "direct mentions" },
    { pattern: /\b(twink|bear|otter|daddy)\b/gi, weight: 6, label: "community slang" },
    { pattern: /\b(musical|broadway|glee|madonna|britney|gaga|cher)\b/gi, weight: 4, label: "culture nodes" },
    { pattern: /\b(outfit|look|fit check|makeover|contour)\b/gi, weight: 3, label: "look discourse" },
    { pattern: /\b(uwu|owo|heehee|teehee)\b/gi, weight: 4, label: "soft phonetics" },
    { pattern: /\b(love you|miss you|thinking of you|you look hot)\b/gi, weight: 3, label: "affection" },
    { pattern: /💅|✨|🌈|💖|🦄|👑|💋|🥵|🙄|💁|🙌|🩷|💜/g, weight: 3, label: "emoji cocktail" },
    { pattern: /\bxoxo\b/gi, weight: 4, label: "xoxo" },
    { pattern: /\b(omg+|omfg+|lol+|lmao+|haha+)\b/gi, weight: 1, label: "expressive filler" },
  ];

  const VERDICTS = [
    { max: 12, text: "Stone-cold straight-passing energy. The group chat is bored." },
    { max: 28, text: "A slight shimmer. Someone said 'bestie' once and you're overthinking it." },
    { max: 44, text: "Vibes are warming. There's a little tea brewing under the table." },
    { max: 60, text: "Confirmed sparkle. This conversation has opinions and accessories." },
    { max: 76, text: "High reading. Somebody is serving looks, lore, and unsolicited shade." },
    { max: 90, text: "Near theatrical. Send help — or send the Spotify playlist." },
    { max: 100, text: "Off the charts. This text could moonlight as a RuPaul confessionals reel." },
  ];

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  function countMatches(text, pattern) {
    const flags = pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`;
    const re = new RegExp(pattern.source, flags);
    return (text.match(re) || []).length;
  }

  function analyzeLexicon(text) {
    /** @type {{ signal: string; hits: number; points: number; detail: string }[]} */
    const findings = [];
    let total = 0;

    for (const item of SIGNAL_LEXICON) {
      const hits = countMatches(text, item.pattern);
      if (!hits) continue;
      const points = Math.min(hits * item.weight, item.weight * 4);
      total += points;
      findings.push({
        signal: item.label,
        hits,
        points,
        detail:
          hits === 1
            ? `Caught one hit of “${item.label}.”`
            : `Caught ${hits} hits of “${item.label}.”`,
      });
    }

    findings.sort((a, b) => b.points - a.points);
    return { total, findings: findings.slice(0, 5) };
  }

  function analyzeStyle(text) {
    const findings = [];
    let total = 0;

    const exclaims = (text.match(/!/g) || []).length;
    if (exclaims >= 3) {
      const points = clamp(exclaims * 1.5, 0, 12);
      total += points;
      findings.push({
        signal: "dramatic punctuation",
        hits: exclaims,
        points: Math.round(points),
        detail: `${exclaims} exclamation marks. Restraint left the chat.`,
      });
    }

    const words = text.match(/[A-Za-z']+/g) || [];
    const capsWords = words.filter(
      (w) => w.length >= 3 && w === w.toUpperCase() && /[A-Z]/.test(w)
    ).length;
    if (capsWords >= 2) {
      const points = clamp(capsWords * 2.5, 0, 14);
      total += points;
      findings.push({
        signal: "ALL CAPS energy",
        hits: capsWords,
        points: Math.round(points),
        detail: `${capsWords} shouted words. Volume is a love language.`,
      });
    }

    const elongated = (text.match(/\b\w*(.)\1{2,}\w*\b/gi) || []).length;
    if (elongated >= 1) {
      const points = clamp(elongated * 3, 0, 10);
      total += points;
      findings.push({
        signal: "stretched syllables",
        hits: elongated,
        points: Math.round(points),
        detail: `Words like “soooo” / “yesss” spotted ${elongated} time(s).`,
      });
    }

    const tildeHeart = (text.match(/[~♥♡★☆•]|:\)|:3|<3/g) || []).length;
    if (tildeHeart >= 2) {
      const points = clamp(tildeHeart * 2, 0, 8);
      total += points;
      findings.push({
        signal: "flourish marks",
        hits: tildeHeart,
        points: Math.round(points),
        detail: "Decorative punctuation doing decorative things.",
      });
    }

    const questionRuns = (text.match(/\?{2,}|\?{1}\s*\?+/g) || []).length;
    if (questionRuns) {
      const points = clamp(questionRuns * 3, 0, 8);
      total += points;
      findings.push({
        signal: "spiraling questions",
        hits: questionRuns,
        points: Math.round(points),
        detail: "Multiple question marks = emotional plot twist incoming.",
      });
    }

    return { total, findings };
  }

  function scoreText(raw) {
    const text = raw.trim();
    if (!text) {
      return {
        score: 0,
        verdict: "Nothing to read. Paste something spicy.",
        breakdown: [],
      };
    }

    const lexicon = analyzeLexicon(text);
    const style = analyzeStyle(text);

    const wordCount = (text.match(/\S+/g) || []).length;
    const densityBoost =
      wordCount > 0
        ? clamp((lexicon.findings.length / Math.sqrt(wordCount)) * 18, 0, 20)
        : 0;

    const rawScore = lexicon.total + style.total + densityBoost;
    // Soft curve so short slang hits still register but long chats don't always max out
    const score = Math.round(clamp(100 * (1 - Math.exp(-rawScore / 55)), 0, 100));

    const verdict =
      VERDICTS.find((v) => score <= v.max)?.text || VERDICTS[VERDICTS.length - 1].text;

    const merged = [...lexicon.findings, ...style.findings]
      .sort((a, b) => b.points - a.points)
      .slice(0, 6);

    if (!merged.length) {
      merged.push({
        signal: "baseline scan",
        hits: 0,
        points: score,
        detail:
          score > 0
            ? "Subtle stylistic tells without flashy keywords."
            : "No spicy signals found. Extremely beige conversation.",
      });
    }

    return { score, verdict, breakdown: merged };
  }

  function animateNumber(el, to, duration = 1000) {
    const from = Number(el.textContent) || 0;
    const start = performance.now();

    function frame(now) {
      const t = clamp((now - start) / duration, 0, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = String(Math.round(from + (to - from) * eased));
      if (t < 1) requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame);
  }

  function setMeter(score) {
    const sweep = clamp(score, 0, 100);
    // Arc is the top semicircle; needle rotates from -90deg (left) to +90deg (right)
    const angle = -90 + (sweep / 100) * 180;
    meterFill.style.strokeDasharray = `${sweep} 100`;
    meterNeedle.style.transform = `rotate(${angle}deg)`;
  }

  function renderBreakdown(items) {
    breakdownEl.innerHTML = "";
    for (const item of items) {
      const li = document.createElement("li");
      li.innerHTML = `
        <span class="signal">${escapeHtml(item.signal)}</span>
        <span class="points">+${Math.round(item.points)}</span>
        <p class="detail">${escapeHtml(item.detail)}</p>
      `;
      breakdownEl.appendChild(li);
    }
  }

  function escapeHtml(str) {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function runAnalysis() {
    const { score, verdict, breakdown } = scoreText(input.value);
    results.hidden = false;
    // retrigger reveal animation
    results.style.animation = "none";
    // force reflow
    void results.offsetWidth;
    results.style.animation = "";

    animateNumber(scoreNumber, score);
    setMeter(score);
    verdictEl.textContent = verdict;
    renderBreakdown(breakdown);
    results.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  analyzeBtn.addEventListener("click", runAnalysis);

  clearBtn.addEventListener("click", () => {
    input.value = "";
    results.hidden = true;
    scoreNumber.textContent = "0";
    setMeter(0);
    verdictEl.textContent = "Warming up…";
    breakdownEl.innerHTML = "";
    input.focus();
  });

  input.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      runAnalysis();
    }
  });

  // initial meter pose
  setMeter(0);
})();
