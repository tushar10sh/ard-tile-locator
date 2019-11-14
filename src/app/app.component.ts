import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'ard-tile-locator';
  searchMode: boolean = false;
  user = {
    isAuthenticated: false
  };
  toggleSearch(e: any): boolean {
    e.preventDefault();
    this.searchMode = !this.searchMode;
    return false;
  }
}
