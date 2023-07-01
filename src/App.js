import React, { useEffect, useState,useRef } from "react";
import { io } from "socket.io-client";
import "./App.css";

let cfg = {
  task: "detect",
  mode: "train",
  model: "yolov8n.pt",
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

const socket = io("http://192.168.204.69:8000");

function App() {
  const [conent, setContent] = useState();
  const [imageSrc, setImageSrc] = useState("");
  const [fileVideo, setFileVideo] = useState("");
  const [roll, setRoll] = useState(0);
  const [pitch, setPitch] = useState(0);
  const [yaw, setYaw] = useState(0);
  const inputRef = useRef()

  function handleStart() {
    cfg.source = fileVideo;
    socket.emit("my image", { data: cfg });
  }

  function handleStop() {
    socket.emit("disconnect");
  }

  useEffect(() => {
    // socket.on("connect", (msg) => {
    //   console.log(msg);
    // });

    socket.on("my connect", (msg) => {
      setContent(msg.data);
    });

    socket.on("my image", (msg) => {
      setImageSrc(msg);
    });
  }, []);

  return (
    <div className="h-screen w-full flex flex-col justify-between bg-gray-50">
      <div className="text-xl text-center font-bold p-3 bg-gray-600 text-gray-200">
        Vehicle - Tracking
      </div>
      <div className="h-full w-full flex gap-4 p-4">
        <div className="w-1/5 flex flex-col gap-2">
          <div className="bg-blue-200 p-4 rounded-lg">
            <div>
              Received :{" "}
              <span className="font-bold text-blue-500">{conent}</span>
            </div>
          </div>

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
                  placeholder=""
                  required
                />
              </div>
            </div>

            <div className="font-bold text-center mt-2">OR</div>

            <div className="flex flex-col gap-2">
              <div className="">
                <label className="block mb-2 text-sm font-medium text-gray-900">
                  File :
                </label>
                <input
                  className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 dark:text-gray-400 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400"
                  type="file"
                  ref={inputRef}
                  // onChange={(e) => console.log(e.target.files)}
                  onChange={() => console.log(inputRef.current.files[0])}
                />
              </div>
            </div>
          </div>

          <div className="flex w-full gap-2">
            <div className="w-1/2 bg-gray-300 p-4 rounded-lg">
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
            </div>
            <div className="w-1/2 bg-gray-300 p-4 rounded-lg">
              <div className="font-bold text-center">RUN</div>

              <div className="flex flex-col gap-2 mt-3">
                <button
                  onClick={handleStart}
                  className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                >
                  Start
                </button>
                <button
                  onClick={handleStop}
                  className="text-white bg-red-600 hover:bg-red-700 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-800"
                >
                  Stop
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="w-3/5 rounded-lg flex justify-center">
          <img
            id="imgFrame"
            src={imageSrc}
            className="w-full h-full rounded-lg ring-2 ring-gray-200"
          />
        </div>

        <div className="w-1/5 flex flex-col gap-2">
          <div className="bg-gray-200 p-4 rounded-lg">
            <div className="text-center font-bold">GRID</div>
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
