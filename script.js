/* =========================================================
   IE PRODUCTION
   PROCESS CYCLE TIME ANALYSIS

   FITUR:
   - Stopwatch
   - Lap
   - Down Time
   - Cycle Time
   - Average Cycle Time
   - Jumlah PCS
   - Output PCS / 30 Menit
   - Total Down Time
   - Waktu Terbuang
   - Kategori Down Time
   - Efficiency Kapasitas Proses
========================================================= */



/* =========================================================
   STOPWATCH VARIABLES
========================================================= */

let running = false;

let startTime = 0;

let elapsedBeforeStart = 0;

let animationFrame = null;


/*
   Semua lap disimpan di dalam array.

   Contoh:

   {
       number: 1,
       total: 10.5,
       lap: 10.5,
       isDowntime: false,
       reason: ""
   }

   atau:

   {
       number: 2,
       total: 20.5,
       lap: 10,
       isDowntime: true,
       reason: "Bundling"
   }
*/

let laps = [];


/*
   Waktu terakhir ketika Lap atau
   Down Time ditekan.

   Ini digunakan agar setiap lap
   hanya menghitung interval waktu
   sejak tombol terakhir ditekan.
*/

let lastLapElapsed = 0;


/*
   Waktu stopwatch ketika tombol STOP
   ditekan.
*/

let finalSeconds = 0;



/* =========================================================
   HELPER
========================================================= */

const $ = (id) => {

    return document.getElementById(id);

};



/* =========================================================
   FORMAT TIMER
========================================================= */

function formatTime(seconds) {

    const totalCentiseconds =
        Math.floor(seconds * 100);


    const minutes =
        Math.floor(
            totalCentiseconds / 6000
        );


    const secs =
        Math.floor(
            (totalCentiseconds % 6000) / 100
        );


    const centis =
        totalCentiseconds % 100;


    return (
        String(minutes).padStart(2, "0")
        +
        ":"
        +
        String(secs).padStart(2, "0")
        +
        "."
        +
        String(centis).padStart(2, "0")
    );

}



/* =========================================================
   CURRENT ELAPSED
========================================================= */

function currentElapsed() {

    if (!running) {

        return elapsedBeforeStart;

    }


    return (
        elapsedBeforeStart
        +
        (
            performance.now()
            -
            startTime
        ) / 1000
    );

}



/* =========================================================
   UPDATE TIMER DISPLAY
========================================================= */

function updateDisplay() {

    const seconds =
        currentElapsed();


    $("timerDisplay").textContent =
        formatTime(seconds);


    $("liveSeconds").textContent =
        `${seconds.toFixed(2)} detik`;


    if (running) {

        animationFrame =
            requestAnimationFrame(
                updateDisplay
            );

    }

}



/* =========================================================
   STATUS
========================================================= */

function setStatus(type, text) {

    const badge =
        $("statusBadge");


    badge.className =
        `status-badge ${type}`;


    badge.textContent =
        text;

}



/* =========================================================
   START
========================================================= */

function startStopwatch() {

    if (running) {

        return;

    }


    running = true;


    startTime =
        performance.now();


    $("startBtn").disabled =
        true;


    $("stopBtn").disabled =
        false;


    $("lapBtn").disabled =
        false;


    $("downtimeBtn").disabled =
        false;


    setStatus(
        "running",
        "RUNNING"
    );


    $("resultMessage").innerHTML =
        "Pengukuran sedang berjalan...";


    updateDisplay();

}



/* =========================================================
   STOP
========================================================= */

function stopStopwatch() {

    if (!running) {

        return;

    }


    /*
       Hitung waktu terakhir yang
       belum masuk ke lap.
    */

    elapsedBeforeStart +=
        (
            performance.now()
            -
            startTime
        ) / 1000;


    running = false;


    cancelAnimationFrame(
        animationFrame
    );


    finalSeconds =
        elapsedBeforeStart;



    /* =====================================================
       PERBAIKAN PENTING

       Ketika Stop ditekan, waktu dari
       lastLapElapsed sampai finalSeconds
       otomatis dibuat menjadi Lap terakhir.

       Contoh:

       Stopwatch = 3600 detik
       Lap terakhir = 3540 detik

       Maka:

       3600 - 3540 = 60 detik

       Otomatis dibuat:

       Lap berikutnya = 60 detik
       Status = Cycle Time
    ====================================================== */

    const finalLapDuration =
        finalSeconds -
        lastLapElapsed;


    if (
        finalLapDuration > 0.01
    ) {

        laps.push({

            number:
                laps.length + 1,

            total:
                finalSeconds,

            lap:
                finalLapDuration,

            isDowntime:
                false,

            reason:
                ""

        });


        lastLapElapsed =
            finalSeconds;

    }


    updateDisplay();


    /*
       Render lap terlebih dahulu
       supaya lap terakhir langsung
       muncul pada tabel.
    */

    renderLaps();


    calculateAll();


    $("startBtn").disabled =
        false;


    $("stopBtn").disabled =
        true;


    $("lapBtn").disabled =
        true;


    $("downtimeBtn").disabled =
        true;


    setStatus(
        "stopped",
        "STOPPED"
    );


    $("resultMessage").innerHTML =
        `Pengukuran selesai.
        Cycle time:
        <b>${finalSeconds.toFixed(2)} detik</b>.`;

}



/* =========================================================
   LAP NORMAL
========================================================= */

function lapStopwatch() {

    if (!running) {

        return;

    }


    const elapsed =
        currentElapsed();


    const lapDuration =
        elapsed -
        lastLapElapsed;


    /*
       Jika waktunya sangat kecil,
       jangan dibuat sebagai lap.
    */

    if (lapDuration <= 0.01) {

        return;

    }


    laps.push({

        number:
            laps.length + 1,

        total:
            elapsed,

        lap:
            lapDuration,

        isDowntime:
            false,

        reason:
            ""

    });


    lastLapElapsed =
        elapsed;


    renderLaps();

    calculateLapAnalysis();

}



/* =========================================================
   DOWN TIME
========================================================= */

function downTimeStopwatch() {

    if (!running) {

        return;

    }


    const elapsed =
        currentElapsed();


    const downtimeDuration =
        elapsed -
        lastLapElapsed;


    /*
       Jangan menyimpan downtime
       apabila durasinya 0 detik.
    */

    if (downtimeDuration <= 0.01) {

        return;

    }


    laps.push({

        number:
            laps.length + 1,

        total:
            elapsed,

        lap:
            downtimeDuration,

        isDowntime:
            true,

        reason:
            "M/C Rusak"

    });


    lastLapElapsed =
        elapsed;


    renderLaps();

    calculateLapAnalysis();


    $("resultMessage").innerHTML =
        `Down Time tercatat:
        <b>${downtimeDuration.toFixed(2)}
        detik</b>.
        Stopwatch tetap berjalan.`;

}



/* =========================================================
   RENDER LAPS
========================================================= */

function renderLaps() {

    const body =
        $("lapBody");


    $("lapCount").textContent =
        `${laps.length} data`;


    if (laps.length === 0) {

        body.innerHTML = `
            <tr class="empty-row">
                <td colspan="5">
                    Belum ada lap.
                </td>
            </tr>
        `;

        return;

    }


    body.innerHTML =
        laps.map(
            item => {

                /*
                   Jika downtime,
                   row diberi class merah.
                */

                if (item.isDowntime) {

                    return `

                        <tr
                            class="downtime-row"
                        >

                            <td>
                                ${item.number}
                            </td>

                            <td>
                                Down Time
                            </td>

                            <td>
                                ${formatTime(item.lap)}
                            </td>

                            <td>
                                ${item.lap.toFixed(2)}
                            </td>

                            <td>

                                <select
                                    class="downtime-select"
                                    onchange="
                                        updateDowntimeReason(
                                            ${item.number - 1},
                                            this.value
                                        )
                                    "
                                >

                                    <option
                                        value="M/C Rusak"
                                        ${
                                            item.reason === "M/C Rusak"
                                            ? "selected"
                                            : ""
                                        }
                                    >
                                        M/C Rusak
                                    </option>

                                    <option
                                        value="Benang Putus"
                                        ${
                                            item.reason === "Benang Putus"
                                            ? "selected"
                                            : ""
                                        }
                                    >
                                        Benang Putus
                                    </option>

                                    <option
                                        value="Bundling"
                                        ${
                                            item.reason === "Bundling"
                                            ? "selected"
                                            : ""
                                        }
                                    >
                                        Bundling
                                    </option>

                                    <option
                                        value="Permak"
                                        ${
                                            item.reason === "Permak"
                                            ? "selected"
                                            : ""
                                        }
                                    >
                                        Permak
                                    </option>

                                    <option
                                        value="Lain-lain"
                                        ${
                                            item.reason === "Lain-lain"
                                            ? "selected"
                                            : ""
                                        }
                                    >
                                        Lain-lain
                                    </option>

                                </select>

                            </td>

                        </tr>

                    `;

                }


                /*
                   Jika lap normal.
                */

                return `

                    <tr>

                        <td>
                            ${item.number}
                        </td>

                        <td>
                            Lap ${item.number}
                        </td>

                        <td>
                            ${formatTime(item.lap)}
                        </td>

                        <td>
                            ${item.lap.toFixed(2)}
                        </td>

                        <td>

                            <span
                                class="normal-status"
                            >
                                Cycle Time
                            </span>

                        </td>

                    </tr>

                `;

            }
        ).join("");

}



/* =========================================================
   UPDATE DOWNTIME REASON
========================================================= */

function updateDowntimeReason(
    index,
    reason
) {

    if (
        index < 0
        ||
        index >= laps.length
    ) {

        return;

    }


    laps[index].reason =
        reason;


    calculateLapAnalysis();

}



/* =========================================================
   GET NUMBER
========================================================= */

function getNumber(id) {

    const value =
        parseFloat(
            $(id).value
        );


    if (
        Number.isFinite(value)
        &&
        value >= 0
    ) {

        return value;

    }


    return 0;

}



/* =========================================================
   INPUT DATA
========================================================= */

function getTarget() {

    return getNumber("target");

}


function getSMV() {

    return getNumber("smv");

}


function getOperators() {

    return getNumber("operators");

}


function getHighestCapacity() {

    return getNumber("highestCapacity");

}


function getTargetEfficiency() {

    return getNumber("targetEfficiency");

}



/* =========================================================
   LAP ANALYSIS
========================================================= */

function calculateLapAnalysis() {


    /*
       Ambil hanya lap normal.
    */

    const normalLaps =
        laps.filter(
            item =>
                !item.isDowntime
        );


    /*
       Ambil hanya lap downtime.
    */

    const downtimeLaps =
        laps.filter(
            item =>
                item.isDowntime
        );



    /* =====================================================
       TOTAL CYCLE TIME

       Hanya lap normal.
    ====================================================== */

    const totalCycleTime =
        normalLaps.reduce(
            (
                total,
                item
            ) =>
                total +
                item.lap,
            0
        );



    /* =====================================================
       JUMLAH PCS

       Jumlah lap normal.
    ====================================================== */

    const jumlahPCS =
        normalLaps.length;



    /* =====================================================
       RATA-RATA CYCLE TIME

       Total Cycle Time
       ----------------
          Jumlah PCS
    ====================================================== */

    let averageCycleTime = 0;


    if (jumlahPCS > 0) {

        averageCycleTime =
            totalCycleTime /
            jumlahPCS;

    }



    /* =====================================================
       HASIL OUTPUT PCS

       1800
       ----
       Average Cycle Time
    ====================================================== */

    let outputPCS = 0;


    if (
        averageCycleTime > 0
    ) {

        outputPCS =
            1800 /
            averageCycleTime;

    }



    /* =====================================================
       TOTAL DOWN TIME
    ====================================================== */

    const totalDowntime =
        downtimeLaps.reduce(
            (
                total,
                item
            ) =>
                total +
                item.lap,
            0
        );



    /* =====================================================
       WAKTU TERBUANG / 30 MENIT

       1800 - Total Cycle Time

       Tidak boleh negatif.
    ====================================================== */

    const wastedTime =
        Math.max(
            0,
            1800 -
            totalCycleTime
        );



    /* =====================================================
       UPDATE DASHBOARD
    ====================================================== */

    $("totalCycleTime").textContent =
        totalCycleTime.toFixed(2);


    $("averageCycleTime").textContent =
        averageCycleTime.toFixed(2);


    $("pcsInfo").textContent =
        `Jumlah PCS: ${jumlahPCS}`;


    $("lapOutputPcs").textContent =
        outputPCS.toFixed(2);


    $("totalDowntime").textContent =
        totalDowntime.toFixed(2);


    $("downtimeCountInfo").textContent =
        `${downtimeLaps.length} kejadian`;


    $("wastedTime30").textContent =
        wastedTime.toFixed(2);



    /*
       Buat daftar penyebab downtime.
    */

    renderDowntimeSummary(
        downtimeLaps
    );

}



/* =========================================================
   DOWNTIME SUMMARY
========================================================= */

function renderDowntimeSummary(
    downtimeLaps
) {

    const container =
        $("downtimeReasonList");


    if (
        downtimeLaps.length === 0
    ) {

        container.innerHTML = `

            <div
                class="empty-downtime"
            >
                Belum ada Down Time.
            </div>

        `;

        return;

    }



    /*
       Kelompokkan downtime
       berdasarkan penyebab.
    */

    const summary = {};


    downtimeLaps.forEach(
        item => {

            const reason =
                item.reason
                ||
                "M/C Rusak";


            if (
                !summary[reason]
            ) {

                summary[reason] = {

                    count: 0,

                    duration: 0

                };

            }


            summary[reason].count += 1;


            summary[reason].duration +=
                item.lap;

        }
    );



    /*
       Urutan kategori.
    */

    const order = [

        "M/C Rusak",

        "Benang Putus",

        "Bundling",

        "Permak",

        "Lain-lain"

    ];


    container.innerHTML =
        order
            .filter(
                reason =>
                    summary[reason]
            )
            .map(
                reason => {

                    const data =
                        summary[reason];


                    return `

                        <div
                            class="
                                downtime-reason-item
                            "
                        >

                            <div
                                class="
                                    downtime-reason-name
                                "
                            >

                                ${reason}

                            </div>

                            <div
                                class="
                                    downtime-reason-value
                                "
                            >

                                ${data.duration.toFixed(2)}
                                detik
                                <br>

                                ${data.count}
                                kejadian

                            </div>

                        </div>

                    `;

                }
            )
            .join("");

}



/* =========================================================
   MAIN CALCULATION
========================================================= */

function calculateAll() {


    /* =====================================================
       INPUT
    ====================================================== */

    const target =
        getTarget();


    const smv =
        getSMV();


    const operators =
        getOperators();


    const highestCapacity =
        getHighestCapacity();


    const targetEfficiency =
        getTargetEfficiency();


    const seconds =
        finalSeconds;


    const minutes =
        seconds / 60;



    /* =====================================================
       KAPASITAS OUTPUT / 30 MENIT

       1800 / Cycle Time
    ====================================================== */

    let capacity30 = 0;


    if (
        seconds > 0
    ) {

        capacity30 =
            1800 /
            seconds;

    }



    /* =====================================================
       KEBUTUHAN MANPOWER

       Target
       -----------------------
       Kapasitas Output
    ====================================================== */

    let manpower = 0;


    if (
        capacity30 > 0
    ) {

        manpower =
            target /
            (
                capacity30
            );

    }



    /* =====================================================
       KAPASITAS OUTPUT HARIAN

       Kapasitas Tertinggi × 16
    ====================================================== */

    const dailyCapacity =
        highestCapacity *
        16;



    /* =====================================================
       EFFICIENCY HARIAN

       Kapasitas Output Harian × SMV
       --------------------------------
       Operator × 8 × 60

       × 100%
    ====================================================== */

    let dailyEfficiency = 0;


    if (
        dailyCapacity > 0
        &&
        smv > 0
        &&
        operators > 0
    ) {

        dailyEfficiency =
            (
                (
                    dailyCapacity *
                    smv
                )
                /
                (
                    operators *
                    8 *
                    60
                )
            )
            *
            100;

    }



    /* =====================================================
       EFFICIENCY KAPASITAS PROSES

       Kapasitas Output × SMV
       ----------------------
             1 × 60 × 60

       × 100%

       CATATAN:
       Kapasitas Output yang digunakan adalah
       kapasitas output / 30 menit.

       BUKAN:
       - Kapasitas Harian
       - Target
       - Kapasitas Tertinggi
    ====================================================== */

    let processCapacityEfficiency = 0;


    if (
        capacity30 > 0
        &&
        smv > 0
    ) {

        processCapacityEfficiency =
            (
                (
                    capacity30 *
                    smv
                )
                /
                (
                    1 *
                    60 *
                    60
                )
            )
            *
            100;

    }



    /* =====================================================
       TARGET EFFICIENCY PRODUKSI / 30 MENIT

       30 × Operator
       --------------
            SMV

       × Efficiency
    ====================================================== */

    let targetProduction30 = 0;


    if (
        smv > 0
        &&
        operators > 0
        &&
        targetEfficiency > 0
    ) {

        targetProduction30 =
            (
                (
                    30 *
                    operators
                )
                /
                smv
            )
            *
            (
                targetEfficiency /
                100
            );

    }



    /* =====================================================
       UPDATE DASHBOARD
    ====================================================== */


    // Stopwatch menit

    $("resultMinutes").textContent =
        minutes.toFixed(2);



    // Stopwatch detik

    $("resultSeconds").textContent =
        seconds.toFixed(2);



    // Target

    $("resultTarget").textContent =
        target.toFixed(2);



    // Kapasitas / 30 menit

    $("resultCapacity").textContent =
        capacity30.toFixed(2);



    // Kapasitas harian

    $("resultDailyCapacity").textContent =
        dailyCapacity.toFixed(2);



    // Efficiency Kapasitas Proses

    $("processCapacityEfficiency").textContent =
        processCapacityEfficiency.toFixed(2);



    // Manpower

    $("resultManpower").textContent =
        manpower.toFixed(2);



    // SMV

    $("linkedSmv").textContent =
        `${smv.toFixed(2)} menit`;



    // Operator

    $("linkedOperators").textContent =
        `${operators.toFixed(0)} orang`;



    // Efficiency harian

    $("dailyEfficiency").textContent =
        `${dailyEfficiency.toFixed(2)}%`;



    // Target produksi 30 menit

    $("targetProduction30").textContent =
        targetProduction30.toFixed(2);



    /* =====================================================
       SUMMARY
    ====================================================== */

    $("summaryCycle").textContent =
        `${seconds.toFixed(2)} detik`;


    $("summaryCapacity").textContent =
        `${capacity30.toFixed(2)} pcs`;


    $("summaryDailyCapacity").textContent =
        `${dailyCapacity.toFixed(2)} pcs`;


    $("summaryEfficiency").textContent =
        `${dailyEfficiency.toFixed(2)}%`;


    $("summaryManpower").textContent =
        `${manpower.toFixed(2)} orang`;


    $("summaryProcess").textContent =
        $("processName").value.trim()
        ||
        "Proses belum diberi nama";



    /*
       Update analisis lap juga.
    */

    calculateLapAnalysis();

}



/* =========================================================
   UPDATE PREVIEW
========================================================= */

function updatePreview() {

    calculateAll();

}



/* =========================================================
   RESET
========================================================= */

function resetStopwatch() {

    running = false;


    cancelAnimationFrame(
        animationFrame
    );


    startTime = 0;


    elapsedBeforeStart = 0;


    lastLapElapsed = 0;


    finalSeconds = 0;


    laps = [];


    $("timerDisplay").textContent =
        "00:00.00";


    $("liveSeconds").textContent =
        "0.00 detik";


    $("startBtn").disabled =
        false;


    $("stopBtn").disabled =
        true;


    $("lapBtn").disabled =
        true;


    $("downtimeBtn").disabled =
        true;


    setStatus(
        "ready",
        "READY"
    );


    renderLaps();


    calculateAll();


    $("resultMessage").innerHTML =
        "Tekan <b>Mulai</b> untuk melakukan pengukuran.";

}



/* =========================================================
   PROCESS NAME
========================================================= */

$("processName")
    .addEventListener(
        "input",
        function () {

            $("summaryProcess").textContent =
                this.value.trim()
                ||
                "Proses belum diberi nama";

        }
    );



/* =========================================================
   TARGET
========================================================= */

$("target")
    .addEventListener(
        "input",
        updatePreview
    );



/* =========================================================
   SMV
========================================================= */

$("smv")
    .addEventListener(
        "input",
        updatePreview
    );



/* =========================================================
   OPERATOR
========================================================= */

$("operators")
    .addEventListener(
        "input",
        updatePreview
    );



/* =========================================================
   KAPASITAS TERTINGGI
========================================================= */

$("highestCapacity")
    .addEventListener(
        "input",
        updatePreview
    );



/* =========================================================
   TARGET EFFICIENCY
========================================================= */

$("targetEfficiency")
    .addEventListener(
        "input",
        updatePreview
    );



/* =========================================================
   INITIALIZATION
========================================================= */

renderLaps();

calculateAll();