document.addEventListener("DOMContentLoaded", () => {
    const playlist = [
      "assets/music/song1.mp3",
      "assets/music/song2.mp3",
      "assets/music/song3.mp3"
    ];
    const songNames = [
      "Neon Horizon – TurquoiseBrush",
      "City of Kings – Hauntrix",
      "Never Again – Wolfy Grande + TurquoiseBrush"
    ];
    let currentTrack = Math.floor(Math.random() * playlist.length);
  
    const audio = document.getElementById("backgroundMusic");
    const playPauseBtn = document.getElementById("playPause");
    const muteToggle = document.getElementById("muteToggle");
    const volumeSlider = document.getElementById("volumeSlider");
    const songTitle = document.getElementById("currentSong");
    const canvas = document.getElementById("visualizer");
    const ctx = canvas.getContext("2d");
  
    let audioCtx, analyser, source, dataArray;
  
    function updateNowPlaying(index) {
      songTitle.textContent = songNames[index];
    }
  
    function loadTrack(index) {
      audio.src = playlist[index];
      updateNowPlaying(index);
      audio.play().then(() => {
        playPauseBtn.innerText = "⏸️";
      }).catch(err => console.log("Autoplay blocked:", err));
    }
  
    function setupVisualizer() {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      analyser = audioCtx.createAnalyser();
      source = audioCtx.createMediaElementSource(audio);
      source.connect(analyser);
      analyser.connect(audioCtx.destination);
      analyser.fftSize = 32;
      dataArray = new Uint8Array(analyser.frequencyBinCount);
  
      function draw() {
        requestAnimationFrame(draw);
        analyser.getByteFrequencyData(dataArray);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        dataArray.forEach((value, i) => {
          const barHeight = value / 2;
          ctx.fillStyle = "#00ffff";
          ctx.fillRect(i * 10, canvas.height - barHeight, 8, barHeight);
        });
      }
      draw();
    }
  
    loadTrack(currentTrack);
    audio.volume = 0.3;
  
    audio.addEventListener("play", () => {
      if (!audioCtx) setupVisualizer();
    });
  
    audio.addEventListener("ended", () => {
      currentTrack = (currentTrack + 1) % playlist.length;
      loadTrack(currentTrack);
    });
  
    document.querySelector(".music-controls").addEventListener("click", (event) => {
      const { id } = event.target;
  
      if (id === "prevTrack") {
        currentTrack = (currentTrack - 1 + playlist.length) % playlist.length;
        loadTrack(currentTrack);
      } else if (id === "nextTrack") {
        currentTrack = (currentTrack + 1) % playlist.length;
        loadTrack(currentTrack);
      } else if (id === "playPause") {
        if (audio.paused) {
          audio.play();
          playPauseBtn.innerText = "⏸️";
        } else {
          audio.pause();
          playPauseBtn.innerText = "▶️";
        }
      } else if (id === "muteToggle") {
        audio.muted = !audio.muted;
        muteToggle.innerText = audio.muted ? "🔊" : "🔇";
      }
    });
  
    volumeSlider.addEventListener("input", (event) => {
      audio.volume = event.target.value;
    });
  });
  