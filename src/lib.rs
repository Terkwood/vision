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
    SwapToVideo(bool),
    TakePicture,
    PictureTaken(String), // dataURL for image
    CanvasClicked,
}

pub struct State {
    link: ComponentLink<State>,
    video: bool,
    snapshot_data_url: Option<String>,
    draw_bounding_boxes: bool,
}

impl Component for State {
    type Message = Msg;
    type Properties = ();

    fn create(_: Self::Properties, link: ComponentLink<Self>) -> Self {
        State {
            link,
            video: false,
            snapshot_data_url: None,
            draw_bounding_boxes: true, // TODO
        }
    }

    fn update(&mut self, msg: Self::Message) -> ShouldRender {
        match msg {
            Msg::CanvasClicked => {
                if self.draw_bounding_boxes {
                    js!{console.log("Idunno");}
                } else {
                    self.link.send_self(Msg::SwapToVideo(true))
                }
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
                <canvas
                    id="canvas",
                    onclick=|_| Msg::CanvasClicked,>
                </canvas>
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
