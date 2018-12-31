#![recursion_limit = "512"]
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
}

pub struct Model {}

impl Component for Model {
    type Message = Msg;
    type Properties = ();

    fn create(_: Self::Properties, mut _link: ComponentLink<Self>) -> Self {
        Model {}
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

                draw(canvas.clone());

                window().add_event_listener(enclose!( (canvas) move |_: ResizeEvent| {
                    draw(canvas.clone());
                }));

                true
            }
        }
    }
}

fn draw(canvas: CanvasElement) {
    canvas.set_width(canvas.offset_width() as u32);
    canvas.set_height(canvas.offset_height() as u32);
    js_draw();
}

/// See the source in `draw.js`
fn js_draw() {
    js! {
        draw();
    }
}

impl Renderable<Model> for Model {
    fn view(&self) -> Html<Self> {
        html! {
            <canvas id="canvas",></canvas>
        }
    }
}
