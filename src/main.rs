extern crate stdweb;
extern crate yew;

use vision::{Model, Msg};
use yew::prelude::*;

fn main() {
    yew::initialize();
    App::<Model>::new().mount_to_body().send_message(Msg::Init);
    yew::run_loop();

    stdweb::event_loop();
}
