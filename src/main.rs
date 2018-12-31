extern crate stdweb;
extern crate yew;

use vision::{Msg, State};
use yew::prelude::*;

fn main() {
    yew::initialize();
    let mut scope = App::<State>::new().mount_to_body();
    yew::run_loop();

    scope.send_message(Msg::Init);
}
