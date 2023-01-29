import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';
import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { IonicStorageModule } from '@ionic/storage-angular';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { HomePage } from './home/home.page';

@NgModule({
	declarations: [
		AppComponent,
		HomePage
	],
	imports: [
		BrowserModule,
		CommonModule,
		FormsModule,
		IonicModule.forRoot({
			mode: 'ios',
			swipeBackEnabled: false
		}),
		IonicStorageModule.forRoot(),
		AppRoutingModule
	],
	providers: [
		{ provide: RouteReuseStrategy, useClass: IonicRouteStrategy }
	],
	bootstrap: [AppComponent],
})
export class AppModule { }
