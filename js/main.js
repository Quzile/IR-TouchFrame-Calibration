// Create and add marker to the screen
const marker = $('<div>').addClass('marker top-left');
const markerText = $('<span>');
marker.append(markerText);
$('body').append(marker);

// Display screen dimensions
$('#screen-dimensions').text(`${window.innerWidth}x${window.innerHeight}`);

// Hide restart button and result box initially
$('#restart-calibration').hide();
$('.infoBox__result').hide();

// Array to store results
const results = [];

// Function to update marker position
function updatePosition(className) {
    marker.removeClass('top-left top-right bottom-left bottom-right');
    marker.addClass(className);
}

// Function to update marker text
function updateMarkerText() {
    const rect = marker[0].getBoundingClientRect();
    const x_marker = rect.left + window.pageXOffset + rect.width / 2;
    const y_marker = rect.top + window.pageYOffset + rect.height / 2;
    markerText.text(`(${x_marker.toFixed(1)}, ${y_marker.toFixed(1)})`);
}

// Function to save coordinates
function saveCoord(e) {
    const x_touch = e.clientX;
    const y_touch = e.clientY;

    const rect = marker[0].getBoundingClientRect();
    const x_marker = rect.left + window.pageXOffset + rect.width / 2;
    const y_marker = rect.top + window.pageYOffset + rect.height / 2;

    const message = `TouchIndex [${results.length + 1}] | TouchCoord [x=${x_touch.toFixed(1)}, y=${y_touch.toFixed(
        1
    )}] | MarkerCoord [x=${x_marker.toFixed(1)}, y=${y_marker.toFixed(1)}]`;

    $('#last-touch').text(`[x=${x_touch.toFixed(1)}, y=${y_touch.toFixed(1)}]`);
    $('#last-marker').text(`[x=${x_marker.toFixed(1)}, y=${y_marker.toFixed(1)}]`);
    console.log(message);

    results.push({
        touch: { x: x_touch, y: y_touch },
        marker: { x: x_marker, y: y_marker },
    });
}

// Function to calculate deviations
function calculateDeviations() {
    return results.map(result => {
        return {
            x: result.marker.x / result.touch.x,
            y: result.marker.y / result.touch.y,
        };
    });
}

// Function to show results
function showResults() {
    $(document).off('click', handleClick);
    marker.hide();
    $('#restart-calibration').show();

    const deviations = calculateDeviations();
    const averageX = deviations.reduce((sum, deviation) => sum + deviation.x, 0) / deviations.length;
    const averageY = deviations.reduce((sum, deviation) => sum + deviation.y, 0) / deviations.length;

    const click_0_X = results[0].touch.x;
    const click_0_Y = results[0].touch.y;
    const click_3_X = results[3].touch.x;
    const click_3_Y = results[3].touch.y;

    const correctedClick0X = click_0_X * averageX;
    const correctedClick0Y = click_0_Y * averageY;
    const correctedClick3X = click_3_X * averageX;
    const correctedClick3Y = click_3_Y * averageY;

    // Calculate coefficients based on the selected percentage and screen dimensions
    const touchFramePercentage = parseFloat(document.getElementById('touchFramePercentage').value);

    const a = (window.innerWidth * touchFramePercentage) / (correctedClick3X - correctedClick0X);
    const c = (window.innerWidth * (1 - touchFramePercentage) - a * correctedClick0X) / window.innerWidth;
    const e = (window.innerHeight * touchFramePercentage) / (correctedClick3Y - correctedClick0Y);
    const f = (window.innerHeight * (1 - touchFramePercentage) - e * correctedClick0Y) / window.innerHeight;

    const command = `xinput set-prop "{YOUR FRAME ID}" "libinput Calibration Matrix" ${a}, 0.0, ${c}, 0.0, ${e}, ${f}, 0.0, 0.0, 1.0`;

    console.log(command);

    $('#finish-command').text(`$ ${command}`);
    $('#finish-command').on('click', function clickResult(e) {
        navigator.clipboard
            .writeText(command)
            .then(() => {
                Toastify({
                    text: 'The command is saved to the clipboard',
                    duration: 3000,
                    newWindow: true,
                    close: true,
                    gravity: 'bottom', // `top` or `bottom`
                    position: 'center', // `left`, `center` or `right`
                    stopOnFocus: true, // Prevents dismissing of toast on hover
                    style: {
                        background: 'linear-gradient(to right, #00b09b, #96c93d)',
                    },
                    onClick: function () {}, // Callback after click
                }).showToast();
            })
            .catch(err => {
                console.log('Something went wrong', err);
            });
    });

    $('.infoBox__result').show();
}

// Function to restart calibration
function calibrationRestart() {
    location.reload();
}

// Function to handle clicks
function handleClick(e) {
    // Prevent click event on the touchFramePercentage select element
    if (e.target.id === 'touchFramePercentage') {
        e.stopPropagation();
        return;
    }

    const positions = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
    const currentPositionIndex = positions.findIndex(position => marker.hasClass(position));
    saveCoord(e);

    if (currentPositionIndex < positions.length - 1) {
        updatePosition(positions[currentPositionIndex + 1]);
    } else {
        showResults();
    }

    updateMarkerText();
}

// Attach click event handler
$(document).on('click', handleClick);

updateMarkerText();
