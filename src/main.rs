extern crate stdweb;
extern crate yew;

use vision::State;
use yew::prelude::*;

fn main() {
    yew::initialize();
    App::<State>::new().mount_to_body();
    yew::run_loop();
}
