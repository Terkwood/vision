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
    Init,
    CamPos(Vec<u32>),
    SwapToVideo(bool),
    TakePicture,
    PictureTaken(String), // dataURL for image
}

#[derive(Clone)]
pub struct CameraPosition {
    x: u32,
    y: u32,
    width: u32,
    height: u32,
}

pub struct State {
    link: ComponentLink<State>,
    camera_position: Option<CameraPosition>,
    video: bool,
    snapshot_data_url: Option<String>,
}

impl Component for State {
    type Message = Msg;
    type Properties = ();

    fn create(_: Self::Properties, link: ComponentLink<Self>) -> Self {
        State {
            link,
            camera_position: None,
            video: false,
            snapshot_data_url: None,
        }
    }

    fn update(&mut self, msg: Self::Message) -> ShouldRender {
        match msg {
            Msg::Init => {
                let canvas: CanvasElement = get_canvas();

                let cb = self.link.send_back(Msg::CamPos);
                let cb_swap_to_video = self.link.send_back(Msg::SwapToVideo);

                draw(canvas, cb, cb_swap_to_video);

                true
            }
            Msg::CamPos(p) => {
                let cp = CameraPosition {
                    x: p[0],
                    y: p[1],
                    width: p[2],
                    height: p[3],
                };

                self.camera_position = Some(cp);
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

                let cb_cam_pos = {
                    let cb = self.link.send_back(Msg::CamPos);
                    move |p: Vec<u32>| cb.emit(p)
                };
                let cb_swap_to_video = {
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
                        snapshotBoundingBoxes(img, 1.0, 1.0);
                        //var cb = @{cb_cam_pos};
                        //var cameraClickCb = @{cb_swap_to_video};
                        //drawCamera(cb, cameraClickCb);
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

fn draw(canvas: CanvasElement, camera_position: Callback<Vec<u32>>, swap_to_video: Callback<bool>) {
    resize_canvas(&canvas);

    js_draw(camera_position, swap_to_video);
}

/// See the source in `draw_bounding_boxes.js`
fn js_draw(camera_position: Callback<Vec<u32>>, swap_to_video: Callback<bool>) {
    let callback = move |p: Vec<u32>| camera_position.emit(p);
    let cb_swap_to_video = move |b: bool| swap_to_video.emit(b);

    js! {
        var cb = @{callback};
        var cameraClickCb = @{cb_swap_to_video};
        draw(cb, cameraClickCb);
    }
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
