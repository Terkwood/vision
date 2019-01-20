#![recursion_limit = "128"]
#[macro_use]
extern crate stdweb;
#[macro_use]
extern crate yew;

use stdweb::traits::*;
use stdweb::unstable::TryInto;
use stdweb::web::html_element::{CanvasElement, ImageElement};
use stdweb::web::{document, CanvasRenderingContext2d};
use yew::prelude::*;

pub enum Msg {
    SwapToVideo(bool), // dummy bool ?
    TakePicture,
    PictureTaken(String), // dataURL for image
    DownloadButtonPos(Vec<u32>),
    DownloadButtonClick(bool), // dummy bool ?
}

pub struct State {
    link: ComponentLink<State>,
    video: bool,
    snapshot_data_url: Option<String>,
    download_button_position: Option<ButtonPosition>,
}

#[derive(Clone)]
pub struct ButtonPosition {
    x: u32,
    y: u32,
    width: u32,
    height: u32,
}

impl Component for State {
    type Message = Msg;
    type Properties = ();

    fn create(_: Self::Properties, link: ComponentLink<Self>) -> Self {
        State {
            link,
            video: false,
            snapshot_data_url: None,
            download_button_position: None,
        }
    }

    fn update(&mut self, msg: Self::Message) -> ShouldRender {
        match msg {
            Msg::DownloadButtonClick(_b) => unimplemented!(),
            Msg::DownloadButtonPos(p) => {
                let p = ButtonPosition {
                    x: p[0],
                    y: p[1],
                    width: p[2],
                    height: p[3],
                };

                self.download_button_position = Some(p);
                false
            }
            Msg::SwapToVideo(b) => {
                self.video = b;
                if b {
                    js! {
                        swapToVideo();
                    }
                }
                true
            }
            Msg::TakePicture => {
                let cb: Callback<String> = self.link.send_back(Msg::PictureTaken);
                let js_cb = move |data_url: String| cb.emit(data_url);

                js! {
                    var callback = @{js_cb};
                    takePicture(callback);
                }
                self.video = false;
                true
            }
            Msg::PictureTaken(data_url) => {
                self.snapshot_data_url = Some(data_url.clone());
                let image = ImageElement::new();
                image.set_attribute("src", &data_url).unwrap();

                let canvas: CanvasElement = get_canvas();
                let context: CanvasRenderingContext2d = canvas.get_context().unwrap();
                resize_canvas(&canvas);

                let cb_dl_btn_pos = {
                    let cb = self.link.send_back(Msg::DownloadButtonPos);
                    move |p: Vec<u32>| cb.emit(p)
                };
                let cb_dl_btn_click = {
                    let cb = self.link.send_back(Msg::SwapToVideo);
                    move |b: bool| cb.emit(b)
                };

                js! {
                    var img = @{image};
                    var cv = @{canvas};
                    var ctx = @{context};
                    img.onload = function() {
                        var w = cv.width / img.width;
                        var h = cv.height / img.height;
                        ctx.scale(w, h);
                        ctx.drawImage(img, 0, 0);
                        ctx.beginPath();
                        ctx.fillStyle = GREEN;
                        ctx.font = FONT;
                        ctx.fillText("PROCESSING", HUD_X, HUD_Y);
                        snapshotBoundingBoxes(img, 1.0, 1.0);
                        var cbDlBtnPos = @{cb_dl_btn_pos};
                        var cbDlnBtnClick = @{cb_dl_btn_click}
                        drawButton(cbDlBtnPos, cbDlnBtnClick);
                    }
                }

                false
            }
        }
    }
}

fn resize_canvas(canvas: &CanvasElement) {
    canvas.set_width(canvas.offset_width() as u32);
    canvas.set_height(canvas.offset_height() as u32);
}

impl Renderable<State> for State {
    fn view(&self) -> Html<Self> {
        if self.video {
            html! {
                <div>
                    <video id="video", onclick=|_| Msg::TakePicture,></video>
                    <canvas id="canvas",></canvas>
                </div>
            }
        } else {
            html! {
                <canvas id="canvas", onclick=|_| Msg::SwapToVideo(true),></canvas>
            }
        }
    }
}

fn get_canvas() -> CanvasElement {
    document()
        .query_selector("#canvas")
        .unwrap()
        .unwrap()
        .try_into()
        .unwrap()
}
