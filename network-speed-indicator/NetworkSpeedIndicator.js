// Constants
const SHOULD_SHOW_NETWORK_SPEED_PROP = "Show Network Speed";
const REFRESH_INTERVAL_PROP = "Refresh Interval (sec)";
const NETWORK_SPEED_EVENT = "Network Speed (Kbps)";
const FILE_URL = "https://s3.amazonaws.com/tulip-network-check/512KB";
const FILE_SIZE = 512000;

// State
let refreshIntervalInSec = 10;
let runTimer;
let inFlight = false;

// Prop Chnage handlers
getValue(SHOULD_SHOW_NETWORK_SPEED_PROP, (showBandwidth) => {
  if (showBandwidth === false) {
    document.getElementById("bandwidth").className = "hidden";
  } else {
    document.getElementById("bandwidth").className = "";
  }
});

getValue(REFRESH_INTERVAL_PROP, (newValue) => {
  if (newValue != null) {
    refreshIntervalInSec = newValue;
    clearTimeout(runTimer);
    run();
  }
});

async function measureBandwidth(fileUrl, sizeBytes) {
  const url = `${fileUrl}?cacheBust=${Math.random()}`;
  const startTime = performance.now();
  await fetch(url);
  const endTime = performance.now();
  const downloadMillis = performance.now() - startTime;
  const bytesPerMillisecond = sizeBytes / downloadMillis;
  const kilobytesPerMillisecond = bytesPerMillisecond / 1e3;
  const kilobitsPerMillisecond = kilobytesPerMillisecond * 8;
  const kilobitsPerSecond = kilobitsPerMillisecond * 1000;
  return kilobitsPerSecond;
}

function bandwidthToSignalStrength(bandwidth) {
  if (bandwidth == null) {
    return 0;
  }

  if (bandwidth > 2000) {
    return 5;
  } else if (bandwidth > 1000) {
    return 4;
  } else if (bandwidth > 500) {
    return 3;
  } else if (bandwidth > 250) {
    return 2;
  } else {
    return 1;
  }
}

function renderBandwidth(bandwidth) {
  let humanizedBandwidth;
  if (bandwidth == null) {
    humanizedBandwidth = "---";
  } else if (bandwidth > 1000) {
    humanizedBandwidth = `${(bandwidth / 1000).toFixed(2)} Mbps`;
  } else {
    humanizedBandwidth = `${bandwidth.toFixed(2)} Kbps`;
  }
  document.getElementById("bandwidth").innerText = humanizedBandwidth;
}

function renderSignalStrength(bandwidth) {
  let signalStrength = bandwidthToSignalStrength(bandwidth);
  //document.getElementById("signal-strength").className = `signal-strength${signalStrength}`;
  for (i = 1; i <= signalStrength; i++) {
    if (signalStrength == 1) {
      document.getElementById(`s${i}`).className.baseVal = "st1";
    } else if (signalStrength == 2) {
      document.getElementById(`s${i}`).className.baseVal = "st2";
    } else {
      document.getElementById(`s${i}`).className.baseVal = "st4";
    }
  }
  document.getElementById("fail").style.display =
    signalStrength >= 4 ? "none" : "";
  renderBandwidth(bandwidth);
}

async function run() {
  if (inFlight) {
    return;
  }
  try {
    inFlight = true;
    const bandwidth = await measureBandwidth(FILE_URL, FILE_SIZE);
    renderSignalStrength(bandwidth);
    fireEvent(NETWORK_SPEED_EVENT, parseFloat(bandwidth.toFixed(2)));
  } catch (e) {
    console.error("Error measuring bandwidth", e);
  } finally {
    inFlight = false;
    runTimer = setTimeout(run, refreshIntervalInSec * 1000);
  }
}

run();
