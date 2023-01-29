import { Component, OnInit } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import { Howl } from 'howler';

var vm: HomePage;

@Component({
	selector: 'app-home',
	templateUrl: 'home.page.html',
	styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit {

	debug: boolean = false;
	orientation: number = 0;
	alpha: number = 0;
	beta: number = 0;
	gamma: number = 0;
	rollout: number = 25;

	mobile: boolean;

	down: boolean = false;
	staged: boolean = false;
	failed: boolean = false;

	since: number;
	until: number;
	footer: string;
	status: string;
	amber1: string;
	amber2: string;
	amber3: string;
	message: string;
	transform: string;

	store: Storage;

	private modes = {
		sportsman: 'sportsman',
		pro: 'pro'
	};
	mode: string = 'sportsman';
	timer: string;
	result: string;
	timeout: {
		stage: any,
		start: any,
		sound: any
	};
	context;
	raf;
	rev;
	run;

	private limit = { x: 45, y: 45 };
	target = { x: 0, y: 0 };

	best: Best = new Best();

	constructor(
		private storage: Storage
	) {
		vm = this;
		vm.best.sportsman = [];
		vm.best.pro = [];

		vm.timeout = {
			stage: null,
			start: null,
			sound: null
		};
	}

	async ngOnInit() {
		
		vm.store = await vm.storage.create();

		window.onfocus = () => {
			console.log('window.onfocus');
			vm.load();
		}


		window.onload = () => {
			console.log('window.onload');
			vm.load();
		}

		vm.render();
		vm.load();
	}

	private ease(was: number, now: number) {
		let e = 5;
		if (now > was) {
			return now > was + e ? was + e : Math.floor(now);
		} else {
			return now < was - e ? was - e : Math.floor(now);
		}
	}

	tilt(e) {
		//exaggeration 
		//vm.target.x = e.gamma * 2;
		//vm.target.y = e.beta * 3;
		if (vm.debug) {
			vm.orientation = window.orientation as number;
			//vm.alpha = Math.round(e.alpha * 100) / 100;
			vm.beta = Math.round(e.beta * 100) / 100;
			vm.gamma = Math.round(e.gamma * 100) / 100;
		}
		let x: number = 0,
			y: number = 0;
		switch (window.orientation) {
			case 90:
				if (e.gamma < 0) {
					//vm.target.x = vm.ease(vm.target.x, e.beta);
					y = vm.ease(vm.target.y, -45 + -e.gamma);
				} else {
					y = vm.ease(vm.target.y, -(45 - e.gamma));
				}
				if (e.beta < -90) {
					x = vm.ease(vm.target.x, -(e.beta + 180));
				} else if (e.beta > 90) {
					x = vm.ease(vm.target.x, -(e.beta - 180));
				} else {
					x = vm.ease(vm.target.x, e.beta);
				}
				break;
			case -90:
				if (e.gamma < -45) {
					y = vm.ease(vm.target.y, e.gamma + 180);
				} else {
					y = vm.ease(vm.target.y, e.gamma - 45);
				}
				if (e.beta > 90) {
					x = vm.ease(vm.target.x, -(180 - e.beta));
				} else if (e.beta < -90) {
					x = vm.ease(vm.target.x, (180 + e.beta));
				} else {
					x = vm.ease(vm.target.x, -e.beta);
				}
				break;
			default:
				x = vm.ease(vm.target.x, e.gamma);
				y = vm.ease(vm.target.y, e.beta - 45);
				break;
		}
		vm.target.x = x > vm.limit.x ? vm.limit.x : x < -vm.limit.x ? -vm.limit.x : x;
		vm.target.y = y > vm.limit.y ? vm.limit.y : y < -vm.limit.y ? -vm.limit.y : y;
		//vm.result = 'orientation: ' + window.orientation.toString() + '<br>x: ' + vm.target.x + '<br>y: ' + vm.target.y + '<br>z: ' + Math.floor(e.alpha);
	}

	update() {
		//let x = vm.target.x > vm.limit.x ? vm.limit.x : vm.target.x < -vm.limit.x ? -vm.limit.x : vm.target.x,
		//    y = vm.target.y > vm.limit.y ? vm.limit.y : vm.target.y < -vm.limit.y ? -vm.limit.y : vm.target.y;
		//vm.transform = 'translate3d(' + x + 'px, ' + y + 'px, 0)';
		vm.transform = 'translate3d(' + vm.target.x + 'px, ' + vm.target.y + 'px, 0)';
		//vm.result = 'translate3d(' + x + 'px, ' + y + 'px, 0)';
	}

	render() {
		vm.update();
		//vm.raf = window.requestAnimationFrame(function () {
		//    vm.render();
		//});
		vm.raf = window.requestAnimationFrame(vm.render);
	}

	test(val) {
		alert('test ' + val);
	}

	async load() {
		try {
			if (!vm.rev) {
				vm.rev = new Howl({ src: ['assets/audio/reving.mp3'], loop: true });
			}
			if (!vm.run) {
				vm.run = new Howl({ src: ['assets/audio/launch.mp3'] });
			}
			vm.status = 'start';
			vm.result = 'TAP PEDAL TO STAGE';
			//vm.message = ' Hold the pedal to begin staging.';
			//console.log('Howler setup');
			//result = 'sound ready';

			const res: Best = await vm.store.get('launch');
			//console.log('launch Best:');
			//console.log(res);
			if (res) {
				vm.best = res;
			} else {
				vm.best.sportsman = [];
				vm.best.pro = [];
			}
		} catch (e) {
			alert("sound not available");
		}
	}

	save(time: number) {
		switch (vm.mode) {
			case vm.modes.sportsman:
				vm.best.sportsman.push(time);
				vm.best.sportsman.sort();
				vm.best.sportsman.splice(5);
				break;
			case vm.modes.pro:
				vm.best.pro.push(time);
				vm.best.pro.sort();
				vm.best.pro.splice(5);
				break;
		}
		//console.log(vm.best);
		vm.store.set('launch', vm.best);
	}

	stage() {
		//alert('stage');
		vm.status = 'start';
		vm.timer = '';
		vm.since = 0;
		vm.result = 'STAGING&hellip;'
		vm.message = 'Press the pedal to launch on green.'

		if (vm.run.playing()) {
			vm.run.stop();
		}
		vm.rev.play();

		vm.timeout.stage = setTimeout(() => {
			vm.result = '';
			vm.staged = true;
			vm.status = 'staged';
			vm.amber1 = '';
			vm.amber2 = '';
			vm.amber3 = '';
			vm.since = new Date().getTime();
			vm.timeout.start = setTimeout(() => {
				//vm.staged = false;
				if (vm.timeout && vm.status != 'failed') {
					vm.status = 'launch';
				}
				clearTimeout(vm.timeout.start);
			}, vm.mode == vm.modes.pro ? 900 : 2500);
			clearTimeout(vm.timeout.stage);
		}, 1000);
	}

	launch() {
		vm.staged = false;
		vm.until = new Date().getTime() + (vm.rollout * 10);
		//console.log('rollout', vm.rollout * 10);
		let span = vm.until - vm.since,
			time: number = 0,
			result: string = '',
			status: string = 'launch';
		if (vm.since === null) {
			vm.failed = true;
			status = 'launch failed';
			result = 'TOO SOON';
		} else {
			switch (vm.mode) {
				case vm.modes.sportsman:
					if (span < 2500) {
						vm.failed = true;
						vm.amber1 = span >= 1000 ? 'fail' : 'pass';
						vm.amber2 = span >= 1500 ? 'fail' : 'pass';
						vm.amber3 = span >= 2000 ? 'fail' : 'pass';
						status = 'failed';
						result = 'DISQUALIFIED';
					} else {
						vm.amber1 = 'pass';
						vm.amber2 = 'pass';
						vm.amber3 = 'pass';
						if (span < 2510) {
							result = 'PERFECTION!';
						} else if (span < 2700) {
							result = 'GREAT';
						} else if (span < 2900) {
							result = 'OKAY';
						} else {
							result = 'TOO SLOW';
						}
					}
					time = (span - 2500) / 1000;
					break;
				case vm.modes.pro:
					if (span < 900) {
						vm.failed = true;
						vm.amber1 = 'fail';
						vm.amber2 = 'fail';
						vm.amber3 = 'fail';
						status = 'failed';
						result = 'DISQUALIFIED';
					} else {
						vm.amber1 = 'pass';
						vm.amber2 = 'pass';
						vm.amber3 = 'pass';
						if (span < 910) {
							result = 'PERFECTION!';
						} else if (span < 1100) {
							result = 'GREAT';
						} else if (span < 1300) {
							result = 'OKAY';
						} else {
							result = 'TOO SLOW';
						}
					}
					time = (span - 900) / 1000;
					break;
			}
		}
		setTimeout(() => {
			//vm.timer = time.toString();
			vm.timer = Number(time).toFixed(3);
			vm.result = result;
			if (status) vm.status = status;
			vm.message = 'Press the pedal to begin staging.';
		}, 1);
		clearTimeout(vm.timeout.stage);
		clearTimeout(vm.timeout.start);
		vm.run.play();
		setTimeout(() => { vm.rev.stop(); }, 50);
		if (time >= 0) {
			setTimeout(() => {
				vm.save(time);
			}, 1);
		}
	}

	start(e) {
		if (!vm.mobile) e.preventDefault();
		//console.log('mouse');
		vm.down = true;
		if (vm.staged) {
			vm.launch();
		} else {
			vm.stage();
		}
		if (vm.mobile) e.preventDefault();
	}

	end(e) {
		if (!vm.mobile) e.preventDefault();
		//console.log('touch');
		vm.down = false;
		if (vm.mobile) e.preventDefault();
	}

	ionViewWillEnter() {
		//vm.ui.statusbar.hide();
	}

	ionViewDidEnter() {
		//vm.mobile = vm.platform.is('mobile') || vm.platform.is('mobileweb');
		//vm.ui.statusbar.style(StatusBarStyle.light);
		
		//if (vm.platform.is('mobile') && window['DeviceOrientationEvent']) {
		//	window.addEventListener('deviceorientation', vm.tilt, false);
		//}
		//let count = 0;
		//setInterval(() => {
		//    count++;
		//    vm.ui.loading.show({ text: 'Downloading Update<span class="progress">' + count + '%</span>' });
		//}, 200);
	}

	ionViewWillLeave() {
		//vm.ui.statusbar.style(StatusBarStyle.default);
		//vm.ui.statusbar.show();
		//if (vm.platform.is('mobile') && window['DeviceOrientationEvent']) {
		//	window.removeEventListener('deviceorientation', vm.tilt);
		//}
	}

}

export class Best {
	sportsman: number[];
	pro: number[];

	constructor() {
		this.sportsman = [];
		this.pro = [];
	}
}
