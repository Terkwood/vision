#![recursion_limit = "256"]
#[macro_use]
extern crate stdweb;
extern crate yew;

use stdweb::traits::*;
use stdweb::unstable::TryInto;
use stdweb::web::html_element::{CanvasElement, ImageElement};
use stdweb::web::Date;
use stdweb::web::{document, CanvasRenderingContext2d};
use yew::prelude::*;

pub enum Screen {
    Splash,
    Video,
    Snapshot,
}

#[derive(Clone)]
pub struct ButtonPosition {
    x: u32,
    y: u32,
    width: u32,
    height: u32,
}

pub enum Msg {
    SwapToVideo,
    TakePicture,
    PictureTaken(String), // dataURL for image
    DownloadButtonPos(Vec<u32>),
    DownloadButtonClicked,
}

pub struct State {
    link: ComponentLink<Self>,
    screen: Screen,
    snapshot_data_url: Option<String>,
    download_button_position: Option<ButtonPosition>,
}

impl Component for State {
    type Message = Msg;
    type Properties = ();

    fn create(_: Self::Properties, link: ComponentLink<Self>) -> Self {
        State {
            link,
            screen: Screen::Splash,
            snapshot_data_url: None,
            download_button_position: None,
        }
    }

    fn update(&mut self, msg: Self::Message) -> ShouldRender {
        match msg {
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
            Msg::SwapToVideo => {
                self.screen = Screen::Video;
                js! {
                    swapToVideo();
                }
                true
            }
            Msg::DownloadButtonClicked => {
                let download = document().get_element_by_id("download-link").unwrap();
                let canvas = query_canvas();
                let img = canvas
                    .to_data_url(Some("image/jpeg"), None)
                    .unwrap()
                    .replace("image/jpeg", "image/octet-stream");
                download.set_attribute("href", &img).unwrap();

                false
            }
            Msg::TakePicture => {
                let cb: Callback<String> = self.link.callback(|s| Msg::PictureTaken(s));
                let js_cb = move |data_url: String| cb.emit(data_url);

                js! {
                    var callback = @{js_cb};
                    takePicture(callback);
                }
                self.screen = Screen::Snapshot;
                true
            }
            Msg::PictureTaken(data_url) => {
                self.snapshot_data_url = Some(data_url.clone());
                let image = ImageElement::new();
                image.set_attribute("src", &data_url).unwrap();

                let canvas: CanvasElement = query_canvas();
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

                        snapshotBoundingBoxes(img);
                    }
                }

                false
            }
        }
    }

    fn change(&mut self, _props: Self::Properties) -> ShouldRender {
        false
    }

    fn view(&self) -> Html {
        match self.screen {
            Screen::Splash => html! {
                <canvas
                    id="canvas"
                    onclick=self.link.callback(|_| Msg::SwapToVideo)></canvas>
            },
            Screen::Video => html! {
                <div>
                    <video
                        id="video"
                        onclick=self.link.callback(|_| Msg::TakePicture)></video>
                    <canvas id="canvas",></canvas>
                </div>
            },
            Screen::Snapshot => {
                html! {
                    <div id="container">
                        <canvas
                            id="canvas"
                            onclick=self.link.callback(|_e| Msg::SwapToVideo)></canvas>
                        <a id="download-link"
                            download={download_file_name()}><button
                            id="download-button"
                            style="background: url(download-outline.png)"
                            onclick=self.link.callback(|_| Msg::DownloadButtonClicked)>
                        </button></a>
                    </div>
                }
            }
        }
    }
}

fn resize_canvas(canvas: &CanvasElement) {
    canvas.set_width(canvas.offset_width() as u32);
    canvas.set_height(canvas.offset_height() as u32);
}

fn download_file_name() -> String {
    let to_secs = 1000;
    format!("vision-{}.jpg", Date::now() as u64 / to_secs as u64)
}

fn query_canvas() -> CanvasElement {
    document()
        .query_selector("#canvas")
        .unwrap()
        .unwrap()
        .try_into()
        .unwrap()
}
