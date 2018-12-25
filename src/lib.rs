#![recursion_limit = "256"]
#[macro_use]
extern crate stdweb;
#[macro_use]
extern crate yew;

use stdweb::traits::*;
use stdweb::unstable::TryInto;
use stdweb::web::event::{ResizeEvent, ResourceLoadEvent};
use stdweb::web::html_element::{CanvasElement, ImageElement};
use stdweb::web::{document, window, CanvasRenderingContext2d};
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

                /* FIXME
                // Draw an image on the canvas
                let image = ImageElement::new();
                image.set_src("crew.jpg");
                
                // WIP:  THIS NEEDS TO BE CALLED ASYNC,
                // ONCE THE IMAGE IS FINISHED LOADING
                // See https://github.com/DenisKolodin/yew#agents---actors-model-inspired-by-erlang-and-actix
                let context: CanvasRenderingContext2d = canvas.get_context().unwrap();
                context.draw_image(image, 10.0, 10.0).unwrap();
                js!{console.log("ok");}
                */

                true
            }
        }
    }
}

fn draw(canvas: CanvasElement) {
    canvas.set_width(canvas.offset_width() as u32);
    canvas.set_height(canvas.offset_height() as u32);
    magic();
}

fn magic() {
    js! {
        var canvas = document.getElementById("canvas");
        var ctx = canvas.getContext("2d");
        var img = new Image();
        img.src = "rusty.jpg";
        img.addEventListener("load", function() {
            ctx.drawImage(img, 10, 10);

            // Notice there is no 'import' statement. 'cocoSsd' and 'tf' is
            // available on the index-page because of the script tag above.

            // Load the model.
            cocoSsd.load().then(model => {
                // detect objects in the image.
                model.detect(img).then(predictions => {
                    console.log("Found " + predictions.length + " predictions");
                    var c = document.getElementById("canvas");
                    var ctx = c.getContext("2d");
                    ctx.lineWidth = 5;

                    const COLORS = ["rgb(255,0,0)", "rgb(255,255,0)", "rgb(0,255,0)", "rgb(0,255,255)"];
                    predictions.forEach(function(p, i) {
                        ctx.beginPath();
                        ctx.strokeStyle = COLORS[i % COLORS.length];
                        ctx.rect(p.bbox[0], p.bbox[1], p.bbox[2], p.bbox[3]);
                        ctx.stroke();
                    });
                });
            });
        }, false);
    }
}

impl Renderable<Model> for Model {
    fn view(&self) -> Html<Self> {
        html! {
            <canvas id="canvas",></canvas>
        }
    }
}
