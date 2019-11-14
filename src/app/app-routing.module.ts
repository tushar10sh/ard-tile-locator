import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { MapAreaComponent } from './map-area/map-area.component';

const routes: Routes = [
  { path: '', redirectTo: 'map-area', pathMatch: 'full' },
  { path: 'map-area', component: MapAreaComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
