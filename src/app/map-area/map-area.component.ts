import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  tileLayer,
  latLng,
  Control,
  DomUtil,
  polyline,
  marker
} from 'leaflet';
import 'leaflet-draw';

import * as turf from '@turf/turf';

export interface GeoBounds {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
}

export interface UserInput {
  path: number;
  row: number;
  lat: number;
  lon: number;
  zone: string;
  h: number;
  v: number;
  place: string;
}

@Component({
  selector: 'app-map-area',
  templateUrl: './map-area.component.html',
  styleUrls: ['./map-area.component.css']
})
export class MapAreaComponent implements OnInit {

  options: any;
  drawOptions: any;
  boundingBox: any;

  userInput: UserInput;

  @ViewChild('userForm', {static: false}) form: ElementRef;
  @ViewChild('option1', {static: false}) option1: ElementRef;
  @ViewChild('option2', {static: false}) option2: ElementRef;
  @ViewChild('option3', {static: false}) option3: ElementRef;
  @ViewChild('option4', {static: false}) option4: ElementRef;

  public latLngString: string = 'Lat: 0.0, Lng: 0.0';
  public rectangleToggle;
  public rectangleToggleText: string = "on";
  public showRectangles: boolean = true;
  public noSearchResultsFound: boolean = false;
  public rectangles = {
    ardRects: [],
    pathRowRects: [],
    ardRectsFiltered: [],
    pathRowRectsFiltered: [],
    ardRectsFilteredLeafletRects: [],
    pathRowRectsFilteredLeafletRects: [],
  };
  public backendUrl = 'http://localhost:3002';

  constructor(
    private http: HttpClient
  ) {
    this.userInput = {
      path: 1,
      row: 1,
      lat: 23,
      lon: 72,
      zone: 'IN',
      h: 1,
      v: 1,
      place: 'Ahmedabad'
    };

    console.log(this.userInput);
    this.options = {
      layers: [
        tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '...' })
      ],
      zoom: 5,
      center: latLng(23, 72)
    };

    this.drawOptions = {
      position: 'topleft',
      draw: {
         marker: true,
         polyline: false,
         polygon: false,
         circle: false,
         circlemarker: false,
         rectangle: false
      }
    };

    this.boundingBox = null;

    const RectangleToggleControl = Control.extend({
      onAdd: (map) => {
        const btn = DomUtil.create('button');
        btn.className = 'btn btn-sm regular-btn';
        btn.innerHTML = `
          <small class='mr-1'>Rectangles</small>
          <span class='badge badge-light'>
            ${this.rectangleToggleText}
          </span>`;
        btn.onclick = (e) => {
          this.handleToggleRectangles(e);
          btn.innerHTML = `
          <small class='mr-1'>Rectangles</small>
          <span class='badge badge-light'>
            ${this.rectangleToggleText}
          </span>`;
        };
        return btn;
      },
      onRemove: (map) => {
      }
    });
    this.rectangleToggle = (opts) => {
      return new RectangleToggleControl(opts);
    };
  }

  ngOnInit() {
    this.http.get(`${this.backendUrl}/ard/`).subscribe(
      (data: any[]) => {
        this.rectangles.ardRects = data['data'];
      }
    );
    this.http.get(`${this.backendUrl}/pathrow/`).subscribe(
      (data: any[]) => {
        this.rectangles.pathRowRects = data['data']
      }
    );
  }

  onMapReady(e: any) {
    this.rectangleToggle({ position: 'topright'}).addTo(e);
  }

  onMapMouseMove(e: any) {
    this.latLngString = `Lat: ${e.latlng.lat.toFixed(3)}, Lng: ${e.latlng.lng.toFixed(3)}`;
  }

  handleDrawStart(e: any) {
    if ( this.boundingBox !== null ) {
      this.boundingBox.remove();
      this.boundingBox = null;
    }
  }

  // calcMinLon( lonarr: any) {
  //   let minLon = 180;
  //   for ( const l of lonarr ) {
  //     if ( l < minLon ) {
  //       minLon = l;
  //     }
  //   }
  //   return minLon;
  // }
  // calcMaxLat( latarr: any) {
  //   let maxLat = -90;
  //   for ( const l of latarr ) {
  //     if ( l > maxLat ) {
  //       maxLat = l;
  //     }
  //   }
  //   return maxLat;
  // }
  // calcMinLat( latarr: any) {
  //   let minLat = 90;
  //   for ( const l of latarr ) {
  //     if ( l < minLat ) {
  //       minLat = l;
  //     }
  //   }
  //   return minLat;
  // }
  // calcMaxLon( lonarr: any) {
  //   let maxLon = -180;
  //   for ( const l of lonarr ) {
  //     if ( l > maxLon ) {
  //       maxLon = l;
  //     }
  //   }
  //   return maxLon;
  // }

  isInsidePartial = ( {selectedGeoBounds, dataGeoBounds} ) => { 
    const lonSide1 = selectedGeoBounds.lon[1] - selectedGeoBounds.lon[0];
    const lonSide2 = dataGeoBounds.lon[1] - dataGeoBounds.lon[0];
    const minLon = dataGeoBounds.lon[0] < selectedGeoBounds.lon[0] ?
      dataGeoBounds.lon[0] :
      selectedGeoBounds.lon[0] ;
    const maxLon = dataGeoBounds.lon[1] < selectedGeoBounds.lon[1] ?
      selectedGeoBounds.lon[1] :
      dataGeoBounds.lon[1] ;
    const lonSideSuper = maxLon - minLon;

    const latSide1 = selectedGeoBounds.lat[0] - selectedGeoBounds.lat[1];
    const latSide2 = dataGeoBounds.lat[0] - dataGeoBounds.lat[1];
    const minLat = dataGeoBounds.lat[1] < selectedGeoBounds.lat[1] ? 
      dataGeoBounds.lat[1] :
      selectedGeoBounds.lat[1] ;
    const maxLat = dataGeoBounds.lat[0] < selectedGeoBounds.lat[0] ?
      selectedGeoBounds.lat[0] :
      dataGeoBounds.lat[0] ;
    const latSideSuper = maxLat - minLat;

    return (
        latSideSuper < ( latSide1 + latSide2 ) &&
        lonSideSuper < ( lonSide1 + lonSide2 )
    );
  }

  handleDrawRectangle(e: any) {

    if ( e.layerType === 'marker') {
      this.option2.nativeElement.checked = true;
      if ( this.boundingBox !== null ) {
        this.boundingBox.remove();
      }
      this.boundingBox = e.layer;
      const latLng = this.boundingBox.getLatLng();
      this.userInput.lat = latLng.lat;
      this.userInput.lon = latLng.lng;
      this.latLonBasedSearch();
    }
  }

  latLonBasedSearch() {
    const selection_bbpoints = [[
      [this.userInput.lat, this.userInput.lon],
      [this.userInput.lat, this.userInput.lon+0.01],
      [this.userInput.lat-0.01, this.userInput.lon+0.01],
      [this.userInput.lat-0.01, this.userInput.lon],
      [this.userInput.lat, this.userInput.lon]
    ]];

    this.rectangles.ardRectsFiltered = this.rectangles.ardRects.filter(
      (elem) => {
        // return true;
        const ul = elem.geoInfo.coordinates.ul;
        const ur = elem.geoInfo.coordinates.ur;
        const ll = elem.geoInfo.coordinates.ll;
        const lr = elem.geoInfo.coordinates.lr;

        const data_bbpoints = [[
          [ul.lat, ul.lon],
          [ur.lat, ur.lon],
          [lr.lat, lr.lon],
          [ll.lat, ll.lon],
          [ul.lat, ul.lon]
        ]];
        const selection_poly = turf.polygon(selection_bbpoints);
        const data_poly = turf.polygon(data_bbpoints);
        const res = turf.intersect(selection_poly, data_poly);
        if ( res !== null ) {
          return true;
        }
      }
    );
    this.rectangles.ardRectsFilteredLeafletRects = this.rectangles.ardRectsFiltered.map(
      (elem) => {
        const ul = elem.geoInfo.coordinates.ul;
        const ur = elem.geoInfo.coordinates.ur;
        const ll = elem.geoInfo.coordinates.ll;
        const lr = elem.geoInfo.coordinates.lr;
        const bbpoints = [
          [ul.lat, ul.lon],
          [ur.lat, ur.lon],
          [lr.lat, lr.lon],
          [ll.lat, ll.lon],
          [ul.lat, ul.lon]
        ];

        const rect = polyline(
          bbpoints,
          { color: '#ff1111',
            weight: 2,
          }
        );
        return rect;
      }
    );
    // console.log(this.rectangles.ardRectsFiltered);
    // this.rectangles.pathRowRectsFiltered = this.rectangles.pathRowRects.filter(
    //   (elem) => {
    //     return this.isInsidePartial({
    //       selectedGeoBounds,
    //       dataGeoBounds: elem.geoInfo.coordinates.ullr
    //     });
    //   }
    // );
    this.rectangles.pathRowRectsFiltered = this.rectangles.pathRowRects.filter(
      (elem) => {
        // return true;
        const ul = elem.geoInfo.coordinates.ul;
        const ur = elem.geoInfo.coordinates.ur;
        const ll = elem.geoInfo.coordinates.ll;
        const lr = elem.geoInfo.coordinates.lr;

        const data_bbpoints = [[
          [ul.lat, ul.lon],
          [ur.lat, ur.lon],
          [lr.lat, lr.lon],
          [ll.lat, ll.lon],
          [ul.lat, ul.lon]
        ]];
        const selection_poly = turf.polygon(selection_bbpoints);
        const data_poly = turf.polygon(data_bbpoints);
        const res = turf.intersect(selection_poly, data_poly);
        if ( res !== null ) {
          return true;
        }
      }
    );
    this.rectangles.pathRowRectsFilteredLeafletRects = this.rectangles.pathRowRectsFiltered.map(
      (elem) => {
        const ul = elem.geoInfo.coordinates.ul;
        const ur = elem.geoInfo.coordinates.ur;
        const ll = elem.geoInfo.coordinates.ll;
        const lr = elem.geoInfo.coordinates.lr;
        const bbpoints = [
          [ul.lat, ul.lon],
          [ur.lat, ur.lon],
          [lr.lat, lr.lon],
          [ll.lat, ll.lon],
          [ul.lat, ul.lon]
        ];

        const rect = polyline(
          bbpoints,
          { color: '#191970',
            weight: 2,
          }
        );
        return rect;
      }
    );
  }

  handleToggleRectangles(e: any): boolean {
    e.preventDefault();
    this.rectangleToggleText = this.rectangleToggleText === 'on' ? 'off' : 'on';
    if ( this.rectangleToggleText === 'off' ) {
      this.showRectangles = false;
    } else {
      this.showRectangles = true;
    }
    return false;
  }

  handlePathChange(path: string) {
    this.userInput.path = parseInt(path, 10);
  }
  handleRowChange(row: string) {
    this.userInput.row = parseInt(row, 10);
  }

  handleLatChange(lat: string) {
    this.userInput.lat = parseFloat(lat);
  }

  handleLonChange(lon: string) {
    this.userInput.lon = parseFloat(lon);
  }

  handleHChange(h: string) {
    this.userInput.h = parseInt(h, 10);
  }

  handleVChange(v: string) {
    this.userInput.v = parseInt(v, 10);
  }

  handlePlaceChange(place: string) {
    this.userInput.place = place;
  }

  searchPlace(e: any) {
    e.preventDefault();
  }

  submitForm(e: any) {
    e.preventDefault();
    if ( this.option1.nativeElement.checked ) {

    } else if ( this.option2.nativeElement.checked ) {
      this.latLonBasedSearch();
    } else if ( this.option3.nativeElement.checked ) {

    } else if ( this.option4.nativeElement.checked ) {

    } else {
      console.log("select an option");
    }
  }

  resetForm(e: any) {
    e.preventDefault();
    this.userInput = {
      path: 1,
      row: 1,
      lat: 23,
      lon: 72,
      zone: 'IN',
      h: 1,
      v: 1,
      place: 'Ahmedabad'
    };
    this.form.nativeElement.reset();
  }

  handlePathBoxClick(e: any) {
    e.preventDefault();
    this.option1.nativeElement.checked = true;
  }

  handleRowBoxClick(e: any) {
    e.preventDefault();
    this.option1.nativeElement.checked = true;
  }

  handleLatBoxClick(e: any) {
    e.preventDefault();
    this.option2.nativeElement.checked = true;
  }

  handleLonBoxClick(e: any) {
    e.preventDefault();
    this.option2.nativeElement.checked = true;
  }

  handleTileZoneInputBoxClick(e: any) {
    e.preventDefault();
    this.option3.nativeElement.checked = true;
  }

  handleTileHInputBoxClick(e: any) {
    e.preventDefault();
    this.option3.nativeElement.checked = true;
  }

  handleTileVInputBoxClick(e: any) {
    e.preventDefault();
    this.option3.nativeElement.checked = true;
  }

  handlePlaceBoxClick(e: any) {
    e.preventDefault();
    this.option4.nativeElement.checked = true;
  }
}
