#![recursion_limit = "128"]
#[macro_use]
extern crate stdweb;
#[macro_use]
extern crate yew;

use stdweb::traits::*;
use stdweb::unstable::TryInto;
use stdweb::web::event::ResizeEvent;
use stdweb::web::html_element::CanvasElement;
use stdweb::web::{document, window};
use yew::prelude::*;

// Shamelessly stolen from stdweb, who shamelessy stole it
// from webplatform's TodoMVC example. :-D
macro_rules! enclose {
    ( ($( $x:ident ),*) $y:expr ) => {
        {
            $(let $x = $x.clone();)*
            $y
        }
    };
}

pub enum Msg {
    Init,
    CamPos(Vec<u32>),
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
}

impl Component for State {
    type Message = Msg;
    type Properties = ();

    fn create(_: Self::Properties, link: ComponentLink<Self>) -> Self {
        State {
            link,
            camera_position: None,
        }
    }

    fn update(&mut self, msg: Self::Message) -> ShouldRender {
        match msg {
            Msg::Init => {
                let canvas: CanvasElement = document()
                    .query_selector("#canvas")
                    .unwrap()
                    .unwrap()
                    .try_into()
                    .unwrap();

                let cb = self.link.send_back(Msg::CamPos);

                draw(canvas.clone(), cb.clone());

                window().add_event_listener(enclose!( (canvas) move |_: ResizeEvent| {
                    draw(canvas.clone(), cb.clone());
                }));

                true
            }
            Msg::CamPos(p) => {
                let cp = CameraPosition {
                    x: p[0],
                    y: p[1],
                    width: p[2],
                    height: p[3],
                };

                let f = {
                    let it = cp.clone();
                    format!(
                        "Camera x:{} y:{} width:{} height:{}",
                        it.x, it.y, it.width, it.height
                    )
                };
                js!{console.log(@{f});}

                self.camera_position = Some(cp);
                false
            },
        }
    }
}

fn draw(canvas: CanvasElement, camera_position: Callback<Vec<u32>>) {
    canvas.set_width(canvas.offset_width() as u32);
    canvas.set_height(canvas.offset_height() as u32);

    js_draw(camera_position);
}

/// See the source in `draw_bounding_boxes.js`
fn js_draw(camera_position: Callback<Vec<u32>>) {
    let callback = move |p: Vec<u32>| camera_position.emit(p);

    js! {
        var cb = @{callback};
        draw(cb);
    }
}

impl Renderable<State> for State {
    fn view(&self) -> Html<Self> {
        html! {
            <canvas id="canvas",></canvas>
        }
    }
}
