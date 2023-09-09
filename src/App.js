import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";
import "./App.css";
import noImage from "./no-image.jpeg";
import { Radio, Switch, DatePicker, TimePicker, Image, Space } from "antd";
import {
  DeleteOutlined,
  DownloadOutlined,
  RotateLeftOutlined,
  RotateRightOutlined,
  SwapOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import Swal from "sweetalert2";

const format = "HH:mm";
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
  retina_masks: true,
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
var isDrawing = false;
var gates = [];
var lanes = [];
var boxs = [];

function App() {
  const [connect, setConnect] = useState();
  const [step, setStep] = useState(0);
  const [imageSrc, setImageSrc] = useState(noImage);
  const [imageTotal, setImageTotal] = useState(noImage);
  const [drawSrc, setDrawSrc] = useState(noImage);
  const [heatmapSrc, setHeatmapSrc] = useState(noImage);
  const [loading, setLoading] = useState(true);

  // const [fileVideo, setFileVideo] = useState("");
  const [ppm, setPPM] = useState(12);
  const [border, setBorder] = useState(true);
  const [center, setCenter] = useState("center");
  const [drawMode, setDrawMode] = useState("gate");

  const [gateXY, setGateXY] = useState([]);
  const [widthTxt, setWidthTxt] = useState(1080);
  const [heightTxt, setHeightTxt] = useState(720);
  const [dateTxt, setDateTxt] = useState("");
  const [timeTxt, setTimeTxt] = useState("");

  const [urlText, setUrlText] = useState(
    "/Users/inforation/Documents/panu/server-vehicle/video/DJI_0311.mp4"
  );
  const [seg, setSeg] = useState(true);
  const [ptText, setPtText] = useState("bestl.pt");

  const [resultText, setResultText] = useState({
    per: "",
    type: {},
  });

  function handleImport() {
    setLoading(true);
    socket.emit("first image", { data: urlText });
  }

  function handleStart() {
    cfg.source = urlText;
    cfg["model"] = ptText;
    cfg["seg"] = seg;
    cfg["ppm"] = ppm;
    cfg["border"] = border;
    cfg["gate"] = gates;
    cfg["lane"] = lanes;
    cfg["box"] = boxs;
    cfg["center"] = center;
    cfg["startTime"] =
      dayjs(dateTxt + timeTxt, "YYYY-MM-DDTHH:mm").unix() * 1000;

    socket.emit("my image", { data: cfg });
  }

  function handleStop() {
    socket.emit("stop");
    setLoading(true);
    setStep(0);
    setImageSrc(noImage);
    setImageTotal(noImage);
    setDrawSrc(noImage);
    setHeatmapSrc(noImage);
    setResultText({
      per: "",
      type: {},
    });
    Swal.close();
  }

  const onDownload = (src) => {
    fetch(src)
      .then((response) => response.blob())
      .then((blob) => {
        const url = URL.createObjectURL(new Blob([blob]));
        const link = document.createElement("a");
        link.href = url;
        link.download = "image.png";
        document.body.appendChild(link);
        link.click();
        URL.revokeObjectURL(url);
        link.remove();
      });
  };

  function percentage(partialValue, totalValue) {
    return (100 * partialValue) / totalValue;
  }

  function deleteGate(_index) {
    let newData = JSON.parse(JSON.stringify(gateXY));
    newData = newData.filter((x, i) => i !== _index);

    setGateXY(newData);
  }

  function drawLine(color, start, end, txt) {
    let canvas = document.getElementById("canvas"),
      ctx = canvas.getContext("2d");

    ctx.beginPath();
    ctx.font = "12px Arial";
    ctx.strokeStyle = color;
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.fillText(txt, (start.x + end.x) / 2, (start.y + end.y) / 2);
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
    ctx.closePath();
  }

  function drawDot(color, x, y) {
    let canvas = document.getElementById("canvas"),
      ctx = canvas.getContext("2d");

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();
  }

  //#region gate
  function startDrawingGate(e) {
    let canvas = document.getElementById("canvas");

    isDrawing = true;

    let x = e.clientX - canvas.getBoundingClientRect().left;
    let y = e.clientY - canvas.getBoundingClientRect().top;

    drawDot("red", x, y);

    if (gates[gates.length - 1]?.length === 1) {
      gates[gates.length - 1].push({ x, y });
      drawLine(
        "red",
        gates[gates.length - 1][0],
        gates[gates.length - 1][1],
        "gate: " + gates.length
      );
    } else {
      gates[gates.length] = [{ x, y }];
    }
  }
  //#endregion gate

  //#region lane
  function startDrawingLane(e) {
    let canvas = document.getElementById("canvas");

    isDrawing = true;

    let x = e.clientX - canvas.getBoundingClientRect().left;
    let y = e.clientY - canvas.getBoundingClientRect().top;

    drawDot("green", x, y);

    if (lanes.length === 0) {
      lanes[0] = [{ x, y }];
    } else if (lanes[lanes.length - 1].length < 4) {
      lanes[lanes.length - 1].push({ x, y });

      if (lanes[lanes.length - 1].length === 2) {
        drawLine(
          "green",
          lanes[lanes.length - 1][0],
          lanes[lanes.length - 1][1],
          "lane: " + lanes.length
        );
      } else if (lanes[lanes.length - 1].length === 3) {
        drawLine(
          "green",
          lanes[lanes.length - 1][1],
          lanes[lanes.length - 1][2],
          "lane: " + lanes.length
        );
      } else {
        drawLine(
          "green",
          lanes[lanes.length - 1][2],
          lanes[lanes.length - 1][3],
          "lane: " + lanes.length
        );
        drawLine(
          "green",
          lanes[lanes.length - 1][3],
          lanes[lanes.length - 1][0],
          "lane: " + lanes.length
        );
      }
    } else {
      lanes[lanes.length] = [{ x, y }];
    }
  }
  //#endregion lane

  //#region box
  function startDrawingBox(e) {
    let canvas = document.getElementById("canvas");

    isDrawing = true;

    let x = e.clientX - canvas.getBoundingClientRect().left;
    let y = e.clientY - canvas.getBoundingClientRect().top;

    drawDot("blue", x, y);

    if (boxs.length === 0) {
      boxs[0] = [{ x, y }];
    } else if (boxs[boxs.length - 1].length < 4) {
      boxs[boxs.length - 1].push({ x, y });

      if (boxs[boxs.length - 1].length === 2) {
        drawLine(
          "blue",
          boxs[boxs.length - 1][0],
          boxs[boxs.length - 1][1],
          "box: " + boxs.length
        );
      } else if (boxs[boxs.length - 1].length === 3) {
        drawLine(
          "blue",
          boxs[boxs.length - 1][1],
          boxs[boxs.length - 1][2],
          "box: " + boxs.length
        );
      } else {
        drawLine(
          "blue",
          boxs[boxs.length - 1][2],
          boxs[boxs.length - 1][3],
          "box: " + boxs.length
        );
        drawLine(
          "blue",
          boxs[boxs.length - 1][3],
          boxs[boxs.length - 1][0],
          "box: " + boxs.length
        );

        console.log(boxs);
      }
    } else {
      boxs[boxs.length] = [{ x, y }];
    }
  }
  //#endregion box

  function handleMouseDown(e) {
    if (step === 1) {
      if (drawMode === "box") {
        startDrawingBox(e);
      } else if (drawMode === "gate") {
        startDrawingGate(e);
      } else {
        startDrawingLane(e);
      }
    }
  }

  function handleMouseMove(e) {}

  function handleMouseUp(e) {}

  useEffect(() => {
    if (!socket) {
      socket = io("http://localhost:8000");
      socket.on("my connect", (msg) => {
        console.log("connect");
        setConnect(msg.data);
        setStep(0);
        setLoading(false);
      });

      socket.on("first image", (msg) => {
        setStep(1);
        setImageSrc(msg.data);
        setWidthTxt(msg.width);
        setHeightTxt(msg.height);
        setDrawSrc(noImage);
        setImageTotal(noImage);
        setHeatmapSrc(noImage);
        setLoading(false);
      });

      socket.on("my image", (msg) => {
        let logSpt = msg?.log?.split(" ")?.[2];
        let per = 0;

        if (logSpt) {
          let frameCnt = logSpt.replace("(", "").replace(")", "").split("/");

          per =
            Math.trunc(percentage(frameCnt[0], frameCnt[1])) + "% " + logSpt;
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
        setHeatmapSrc(msg.heatmap);
      });

      handleStop();
    }
  }, []);

  useEffect(() => {
    if (resultText.per.includes("100%")) {
      Swal.fire({
        title: "บันทึกสำเร็จ",
        text: null,
        icon: "success",
        // showConfirmButton: false,
        confirmButtonText: "ปิด",
        allowOutsideClick: false,
        allowEscapeKey: false,
      }).then(function (_cf) {});
    }
  }, [resultText]);

  return (
    <div className="h-full w-full flex flex-col justify-between bg-gray-50">
      {loading ? (
        <div className="fixed top-0 left-0 right-0 bottom-0 w-full h-screen z-50 overflow-hidden bg-gray-700 opacity-75 flex flex-col items-center justify-center">
          <div className="border-t-blue-700 animate-spin ease-linear rounded-full border-4 border-t-4 border-gray-200 h-12 w-12 mb-4"></div>
          <h2 className="text-center text-white text-xl font-semibold">
            Loading ...
          </h2>
        </div>
      ) : null}

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
                <div className="">
                  <label className="block mb-2 text-sm font-medium text-gray-900">
                    Segmentation :
                  </label>
                  <Switch
                    checked={seg}
                    className="bg-gray-200"
                    onChange={setSeg}
                  />
                </div>
                <div className="">
                  <label className="block mb-2 text-sm font-medium text-gray-900">
                    Weights (.pt) :
                  </label>
                  <input
                    type="text"
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                    placeholder="ชื่อไฟล์"
                    value={ptText}
                    onChange={(e) => setPtText(e.target.value)}
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
                    <Radio.Group
                      value={drawMode}
                      onChange={(e) => setDrawMode(e.target.value)}
                    >
                      <Radio.Button value="gate">gate</Radio.Button>
                      <Radio.Button value="lane">lane</Radio.Button>
                      <Radio.Button value="box">box</Radio.Button>
                    </Radio.Group>
                  </div>
                </div>
              </div>
              {gateXY.length > 0 ? (
                <div className="w-full bg-gray-300 p-4 rounded-lg">
                  <div className="flex flex-col gap-2">
                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-900">
                        Gate :
                      </label>
                      {gateXY.map((x, i) => (
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
                      Date-Time :
                    </label>
                    <DatePicker
                      defaultValue={dayjs()}
                      className="mr-1"
                      onChange={(date, dateString) => {
                        setDateTxt(dateString);
                      }}
                    />
                    <TimePicker
                      defaultValue={dayjs()}
                      format={format}
                      onChange={(time, timeString) => {
                        setTimeTxt(timeString);
                      }}
                    />
                  </div>
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
                      <Radio.Button value="top" className="px-2">
                        top
                      </Radio.Button>
                      <Radio.Button value="left" className="px-2">
                        left
                      </Radio.Button>
                      <Radio.Button value="center" className="px-2">
                        center
                      </Radio.Button>
                      <Radio.Button value="right" className="px-2">
                        right
                      </Radio.Button>
                      <Radio.Button value="bottom" className="px-2">
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
        </div>

        <div className="w-4/5 h-full rounded-lg flex flex-col justify-start gap-4">
          <div className="rounded-lg ring-2 ring-gray-200 overflow-x-scroll">
            {/* <img src={imageSrc} style={{ width: "640px", height: "360px" }} /> */}
            <canvas
              id="canvas"
              width={widthTxt}
              height={heightTxt}
              style={{
                backgroundImage: `url('${imageSrc}')`,
              }}
              onMouseDown={(e) => {
                handleMouseDown(e);
                // if (step === 1 && stopXY.includes(null)) {
                //   let x = e.pageX - e.target.offsetLeft;
                //   let y = e.pageY - e.target.offsetTop;

                //   setStartXY([x, y]);
                // }
              }}
              onMouseMove={(e) => {
                handleMouseMove(e);
                // if (step === 1 && !startXY.includes(null)) {
                //   let x = e.pageX - e.target.offsetLeft;
                //   let y = e.pageY - e.target.offsetTop;

                //   setStopXY([x, y]);
                // }
              }}
              onMouseUp={(e) => {
                handleMouseUp(e);
                //   if (
                //     step === 1 &&
                //     !startXY.includes(null) &&
                //     !stopXY.includes(null)
                //   ) {
                //     setStartXY([null, null]);
                //     setStopXY([null, null]);

                //     let newData = JSON.parse(JSON.stringify(gateXY));
                //     let cnt = newData.length;
                //     newData[cnt] = [startXY[0], startXY[1], stopXY[0], stopXY[1]];

                //     setGateXY(newData);
                //   } else {
                //     setStartXY([null, null]);
                //     setStopXY([null, null]);
                //   }
              }}
            ></canvas>
          </div>

          <div className="w-full h-2/3 flex flex-row gap-4">
            <div className="flex justify-center rounded-lg ring-2 ring-gray-200">
              <Image
                src={drawSrc}
                style={{ width: "640px", height: "360px" }}
                preview={{
                  toolbarRender: (
                    _,
                    {
                      transform: { scale },
                      actions: {
                        onFlipY,
                        onFlipX,
                        onRotateLeft,
                        onRotateRight,
                        onZoomOut,
                        onZoomIn,
                      },
                    }
                  ) => (
                    <Space size={12} className="toolbar-wrapper">
                      <DownloadOutlined onClick={() => onDownload(drawSrc)} />
                      <SwapOutlined rotate={90} onClick={onFlipY} />
                      <SwapOutlined onClick={onFlipX} />
                      <RotateLeftOutlined onClick={onRotateLeft} />
                      <RotateRightOutlined onClick={onRotateRight} />
                      <ZoomOutOutlined
                        disabled={scale === 1}
                        onClick={onZoomOut}
                      />
                      <ZoomInOutlined
                        disabled={scale === 50}
                        onClick={onZoomIn}
                      />
                    </Space>
                  ),
                }}
              />
            </div>
            <div className="flex justify-centerrounded-lg ring-2 ring-gray-200">
              <Image
                src={imageTotal}
                style={{ width: "640px", height: "360px" }}
                preview={{
                  toolbarRender: (
                    _,
                    {
                      transform: { scale },
                      actions: {
                        onFlipY,
                        onFlipX,
                        onRotateLeft,
                        onRotateRight,
                        onZoomOut,
                        onZoomIn,
                      },
                    }
                  ) => (
                    <Space size={12} className="toolbar-wrapper">
                      <DownloadOutlined
                        onClick={() => onDownload(imageTotal)}
                      />
                      <SwapOutlined rotate={90} onClick={onFlipY} />
                      <SwapOutlined onClick={onFlipX} />
                      <RotateLeftOutlined onClick={onRotateLeft} />
                      <RotateRightOutlined onClick={onRotateRight} />
                      <ZoomOutOutlined
                        disabled={scale === 1}
                        onClick={onZoomOut}
                      />
                      <ZoomInOutlined
                        disabled={scale === 50}
                        onClick={onZoomIn}
                      />
                    </Space>
                  ),
                }}
              />
            </div>
          </div>

          <div className="w-full h-full rounded-lg flex flex-col justify-start gap-4">
            <div className="flex w-full items-center justify-center rounded-lg ring-2 ring-gray-200 overflow-x-scroll">
              <Image
                src={heatmapSrc}
                style={{ width: "1080px", height: "720px" }}
                preview={{
                  toolbarRender: (
                    _,
                    {
                      transform: { scale },
                      actions: {
                        onFlipY,
                        onFlipX,
                        onRotateLeft,
                        onRotateRight,
                        onZoomOut,
                        onZoomIn,
                      },
                    }
                  ) => (
                    <Space size={12} className="toolbar-wrapper">
                      <DownloadOutlined
                        onClick={() => onDownload(heatmapSrc)}
                      />
                      <SwapOutlined rotate={90} onClick={onFlipY} />
                      <SwapOutlined onClick={onFlipX} />
                      <RotateLeftOutlined onClick={onRotateLeft} />
                      <RotateRightOutlined onClick={onRotateRight} />
                      <ZoomOutOutlined
                        disabled={scale === 1}
                        onClick={onZoomOut}
                      />
                      <ZoomInOutlined
                        disabled={scale === 50}
                        onClick={onZoomIn}
                      />
                    </Space>
                  ),
                }}
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
