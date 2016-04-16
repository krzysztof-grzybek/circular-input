var DEMO = {
  init: function () {
    this.initAbleton();
    this.initReason();
  },
  initAbleton: function () {
    var abletonBox = document.getElementById('ableton-box'),
        toggleButton = document.getElementById('ableton-box-toggle');

    toggleButton.addEventListener('click', function (e) {
      toggleAbletonBox();
    });

    function toggleAbletonBox () {
      abletonBox.classList.toggle('off');
    }
  },
  initReason: function () {
    var reasonPitchInput = document.getElementById('reason-pitch-input'),
        reasonVelInput = document.getElementById('reason-vel-input'),
        pitchLamp = document.getElementById('pitch-lamp'),
        velLamp = document.getElementById('vel-lamp');

    reasonPitchInput.addEventListener('change', function () {
      if (Number(reasonPitchInput.value) === 250) {
        pitchLamp.classList.remove('on');
      } else {
        pitchLamp.classList.add('on');
      }
    });
    reasonVelInput.addEventListener('change', function () {
      if (Number(reasonVelInput.value) === 250) {
        velLamp.classList.remove('on');
      } else {
        velLamp.classList.add('on');
      }
    });
  }
};

DEMO.init();
