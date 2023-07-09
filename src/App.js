import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";
import "./App.css";
import noImage from "./no-image.jpeg";
import { Radio, Switch, Button } from "antd";
import { DeleteOutlined } from "@ant-design/icons";

let cfg = {
  task: "detect",
  mode: "train",
  model: "best.pt",
  data: null,
  epochs: 100,
  patience: 50,
  batch: 16,
  imgsz: 640,
  save: true,
  cache: false,
  device: null,
  workers: 8,
  project: null,
  name: null,
  exist_ok: false,
  pretrained: false,
  optimizer: "SGD",
  verbose: false,
  seed: 0,
  deterministic: true,
  single_cls: false,
  image_weights: false,
  rect: false,
  cos_lr: false,
  close_mosaic: 10,
  resume: false,
  overlap_mask: true,
  mask_ratio: 4,
  dropout: 0.0,
  val: true,
  save_json: false,
  save_hybrid: false,
  conf: null,
  iou: 0.7,
  max_det: 300,
  half: false,
  dnn: false,
  plots: true,
  source: "video/test.mp4",
  show: true,
  save_txt: false,
  save_conf: false,
  save_crop: false,
  hide_labels: false,
  hide_conf: false,
  vid_stride: 1,
  line_thickness: 3,
  visualize: false,
  augment: false,
  agnostic_nms: false,
  retina_masks: false,
  format: "torchscript",
  keras: false,
  optimize: false,
  int8: false,
  dynamic: false,
  simplify: false,
  opset: 17,
  workspace: 4,
  nms: false,
  lr0: 0.01,
  lrf: 0.01,
  momentum: 0.937,
  weight_decay: 0.0005,
  warmup_epochs: 3.0,
  warmup_momentum: 0.8,
  warmup_bias_lr: 0.1,
  box: 7.5,
  cls: 0.5,
  dfl: 1.5,
  fl_gamma: 0.0,
  label_smoothing: 0.0,
  nbs: 64,
  hsv_h: 0.015,
  hsv_s: 0.7,
  hsv_v: 0.4,
  degrees: 0.0,
  translate: 0.1,
  scale: 0.5,
  shear: 0.0,
  perspective: 0.0,
  flipud: 0.0,
  fliplr: 0.5,
  mosaic: 1.0,
  mixup: 0.0,
  copy_paste: 0.0,
  v5loader: false,
};

var socket = undefined;

function App() {
  const [connect, setConnect] = useState();
  const [step, setStep] = useState(0);
  const [imageSrc, setImageSrc] = useState(noImage);
  const [imageTotal, setImageTotal] = useState(noImage);
  const [drawSrc, setDrawSrc] = useState(noImage);
  const [fileVideo, setFileVideo] = useState("");
  const [roll, setRoll] = useState(0);
  const [pitch, setPitch] = useState(0);
  const [yaw, setYaw] = useState(0);
  const [ppm, setPPM] = useState(8);
  const [border, setBorder] = useState(true);
  const [center, setCenter] = useState("bottom");

  const [startXY, setStartXY] = useState([null, null]);
  const [stopXY, setStopXY] = useState([null, null]);
  const [ssXY, setSSXY] = useState([]);
  const [widthTxt, setWidthTxt] = useState(1280);
  const [heightTxt, setHeightTxt] = useState(720);

  const [urlText, setUrlText] = useState(
    "/Users/inforation/Documents/panu/server-vehicle/video/test3.mp4"
  );

  const [resultText, setResultText] = useState({
    per: "",
    type: {},
  });

  function handleImport() {
    socket = io("http://127.0.0.1:8000");

    socket.on("my connect", (msg) => {
      setConnect(msg.data);
      setStep(1);
    });

    socket.on("first image", (msg) => {
      setImageSrc(msg.data);
      setDrawSrc(noImage);
      setImageTotal(noImage);
    });

    socket.on("my image", (msg) => {
      let logSpt = msg?.log?.split(" ")?.[2];
      let per = 0;

      if (logSpt) {
        let frameCnt = logSpt.replace("(", "").replace(")", "").split("/");

        per = Math.trunc(percentage(frameCnt[0], frameCnt[1])) + "% " + logSpt;
      }

      let newResult = { ...resultText };
      newResult.per = per;

      msg.list.map((y) => {
        if (!newResult.type[y.type]) newResult.type[y.type] = [];

        if (!newResult.type[y.type].includes(y.id)) {
          newResult.type[y.type].push(y.id);
        }
      });

      setResultText(newResult);
      setImageSrc(msg.data);
      setDrawSrc(msg.draw);
      setImageTotal(msg.totalImg);
    });

    socket.emit("first image", { data: urlText });
  }

  function handleStart() {
    cfg.source = urlText;
    cfg["ppm"] = ppm;
    cfg["border"] = border;
    cfg["gate"] = ssXY;
    cfg["center"] = center;

    console.log(ssXY);

    socket.emit("my image", { data: cfg });
  }

  function handleStop() {
    socket.emit("client_disconnecting");
  }

  function drawLine(can, ctx, x, y, stopX, stopY, gateTxt) {
    let imageDpi = 300;
    ctx.strokeStyle = "red";
    // ctx.clearRect(0, 0, can.width, can.height);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(stopX, stopY);
    ctx.closePath();
    ctx.stroke();

    // calculate length
    let pixelLength = Math.sqrt(
      Math.pow(stopX - x, 2) + Math.pow(stopY - y, 2)
    );
    let physicalLength = pixelLength / imageDpi;

    // console.log(
    //   "line length = " +
    //     physicalLength +
    //     " inches (image at " +
    //     imageDpi +
    //     " dpi)"
    // );
  }

  function percentage(partialValue, totalValue) {
    return (100 * partialValue) / totalValue;
  }

  function deleteGate(_index) {
    let newData = JSON.parse(JSON.stringify(ssXY));
    newData = newData.filter((x, i) => i !== _index);

    setSSXY(newData);
  }

  function drawLineAll(_ssXY) {
    if (_ssXY?.length > 0) {
      let canvas = document.getElementById("canvas"),
        ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < _ssXY.length; i++) {
        drawLine(
          canvas,
          ctx,
          _ssXY[i][0],
          _ssXY[i][1],
          _ssXY[i][2],
          _ssXY[i][3]
        );

        ctx.font = "12px Arial";
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.textBackgroundColor = "green";
        ctx.fillText(
          "gate: " + i,
          (_ssXY[i][0] + _ssXY[i][2]) / 2,
          (_ssXY[i][1] + _ssXY[i][3]) / 2
        );
      }
    }
  }

  useEffect(() => {
    if (!startXY.includes(null) && !stopXY.includes(null)) {
      let canvas = document.getElementById("canvas"),
        ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      drawLine(canvas, ctx, startXY[0], startXY[1], stopXY[0], stopXY[1]);
    }
  }, [startXY, stopXY]);

  useEffect(() => {
    drawLineAll(ssXY);
  }, [ssXY]);

  return (
    <div className="h-full w-full flex flex-col justify-between bg-gray-50">
      <div className="text-xl text-center font-bold p-3 bg-gray-600 text-gray-200">
        Vehicle - Tracking
      </div>
      <div className="h-full w-full flex gap-4 p-4">
        <div className="w-1/5 flex flex-col gap-2">
          <div className="bg-blue-200 p-4 rounded-lg">
            <div>
              Received :{" "}
              <span className="font-bold text-blue-500">{connect}</span>
            </div>
          </div>

          {step === 0 ? (
            <div className="bg-gray-300 p-4 rounded-lg">
              <div className="font-bold text-center">IMPORT</div>

              <div className="flex flex-col gap-2">
                <div className="">
                  <label className="block mb-2 text-sm font-medium text-gray-900">
                    URL :
                  </label>
                  <input
                    type="text"
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                    placeholder="ที่อยู่ไฟล์"
                    value={urlText}
                    onChange={(e) => setUrlText(e.target.value)}
                  />
                </div>
                <button
                  onClick={handleImport}
                  className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                >
                  Import
                </button>
              </div>
            </div>
          ) : step === 1 ? (
            <>
              <div className="w-full bg-gray-300 p-4 rounded-lg">
                <div className="font-bold text-center mb-2">DRAW</div>

                <div className="flex flex-col gap-2">
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-900">
                      Mode :
                    </label>
                    <Radio.Group value={"gate"}>
                      <Radio.Button value="gate">gate</Radio.Button>
                      <Radio.Button value="lane">lane</Radio.Button>
                    </Radio.Group>
                  </div>
                </div>
              </div>
              {ssXY.length > 0 ? (
                <div className="w-full bg-gray-300 p-4 rounded-lg">
                  <div className="flex flex-col gap-2">
                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-900">
                        Gate :
                      </label>
                      {ssXY.map((x, i) => (
                        <div className="ml-4 mb-2 flex gap-4 w-1/1 justify-between border-b-2 border-gray-500 pb-2">
                          <label>gate: {i}</label>
                          <button
                            onClick={() => deleteGate(i)}
                            className="flex justify-center items-center bg-red-400 p-1 text-white rounded-lg"
                          >
                            <DeleteOutlined />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="flex w-full gap-2">
                <div className="w-full bg-gray-300 p-4 rounded-lg">
                  <button
                    onClick={() => setStep(2)}
                    className="w-full text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          ) : step === 2 ? (
            <>
              <div className="w-full bg-gray-300 p-4 rounded-lg">
                <div className="font-bold text-center mb-2">CONFIG</div>

                <div className="flex flex-col gap-2">
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-900">
                      PPM :
                    </label>
                    <input
                      type="number"
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                      value={ppm}
                      onChange={(e) => setPPM(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-900">
                      Border :
                    </label>
                    <Switch
                      defaultChecked
                      className="bg-gray-200"
                      onChange={setBorder}
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-900">
                      Center :
                    </label>
                    <Radio.Group
                      value={center}
                      onChange={(e) => setCenter(e.target.value)}
                    >
                      <Radio.Button value="top" className="px-3">
                        top
                      </Radio.Button>
                      <Radio.Button value="left" className="px-3">
                        left
                      </Radio.Button>
                      <Radio.Button value="center" className="px-3">
                        center
                      </Radio.Button>
                      <Radio.Button value="right" className="px-3">
                        right
                      </Radio.Button>
                      <Radio.Button value="bottom" className="px-3">
                        bottom
                      </Radio.Button>
                    </Radio.Group>
                  </div>
                </div>
              </div>

              <div className="flex w-full gap-2">
                <div className="w-full bg-gray-300 p-4 rounded-lg">
                  <button
                    onClick={() => {
                      handleStart();
                      setStep(3);
                    }}
                    className="w-full text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                  >
                    Start
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex w-full gap-2">
              <div className="w-full bg-gray-300 p-4 rounded-lg">
                <button
                  onClick={handleStop}
                  className="w-full text-white bg-red-600 hover:bg-red-700 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-800"
                >
                  Stop
                </button>
              </div>
            </div>
          )}

          {/* <div className="w-1/2 bg-gray-300 p-4 rounded-lg">
              <div className="font-bold text-center mb-2">CONFIG</div>

              <div className="flex flex-col gap-2">
                <div>
                  <label>
                    Roll : <span>{roll}</span>
                  </label>
                  <input
                    type="range"
                    value={roll}
                    onChange={(e) => setRoll(e.target.value)}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                  />
                </div>
                <div>
                  <label>
                    Picth : <span>{pitch}</span>
                  </label>
                  <input
                    type="range"
                    value={pitch}
                    onChange={(e) => setPitch(e.target.value)}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                  />
                </div>
                <div>
                  <label>
                    Yaw : <span>{yaw}</span>
                  </label>
                  <input
                    type="range"
                    value={yaw}
                    onChange={(e) => setYaw(e.target.value)}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                  />
                </div>
              </div>
            </div> */}
        </div>

        <div className="w-4/5 h-full rounded-lg flex flex-col justify-start gap-4">
          <div className="flex justify-center rounded-lg ring-2 ring-gray-200">
            {/* <img src={imageSrc} style={{ width: "640px", height: "360px" }} /> */}
            <canvas
              id="canvas"
              width={widthTxt}
              height={heightTxt}
              style={{
                backgroundImage: `url('${imageSrc}')`,
              }}
              onMouseDown={(e) => {
                if (step === 1 && stopXY.includes(null)) {
                  let x = e.pageX - e.target.offsetLeft;
                  let y = e.pageY - e.target.offsetTop;

                  setStartXY([x, y]);
                }
              }}
              onMouseMove={(e) => {
                if (step === 1 && !startXY.includes(null)) {
                  let x = e.pageX - e.target.offsetLeft;
                  let y = e.pageY - e.target.offsetTop;

                  setStopXY([x, y]);
                }
              }}
              onMouseUp={() => {
                if (
                  step === 1 &&
                  !startXY.includes(null) &&
                  !stopXY.includes(null)
                ) {
                  setStartXY([null, null]);
                  setStopXY([null, null]);

                  let newData = JSON.parse(JSON.stringify(ssXY));
                  let cnt = newData.length;
                  newData[cnt] = [startXY[0], startXY[1], stopXY[0], stopXY[1]];

                  setSSXY(newData);
                } else {
                  setStartXY([null, null]);
                  setStopXY([null, null]);
                }
              }}
            ></canvas>
          </div>

          <div className="w-full h-2/3 flex flex-row gap-4">
            <div className="flex justify-center rounded-lg ring-2 ring-gray-200">
              <img src={drawSrc} style={{ width: "640px", height: "360px" }} />
            </div>
            <div className="flex justify-centerrounded-lg ring-2 ring-gray-200">
              <img
                src={imageTotal}
                style={{ width: "640px", height: "360px" }}
              />
            </div>
          </div>
          <div className="bg-gray-500 w-2/2 h-1/3 rounded-lg p-4 text-white font-bold">
            <div className="mb-2 w-full flex justify-between">
              <div>
                ทั้งหมด:{" "}
                {Object.values(resultText.type).reduce(
                  (a, b) => Number(a) + Number(b.length),
                  0
                )}
                {" คัน"}
              </div>
              <div>{resultText.per}</div>
            </div>

            <table className="table-auto w-full">
              <thead className="text-gray-700 bg-gray-100">
                <tr>
                  <th>ประเภทรถ</th>
                  <th>จำนวน (คัน)</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(resultText.type).map((x) => (
                  <tr key={x} className="text-center border-b-2">
                    <td>{x}</td>
                    <td>{resultText.type[x].length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div className="text-xl text-center font-bold p-3 bg-gray-600 text-gray-200">
        DevTeam - 2023
      </div>
    </div>
  );
}

export default App;
