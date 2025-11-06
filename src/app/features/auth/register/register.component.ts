import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {

  constructor(private router: Router) { }

  ngOnInit(): void {
  }

  onRegister(e: Event) {
    e.preventDefault();
    // Use sessionStorage so registration/login is tab-scoped and consistent with login flow
    sessionStorage.setItem('isLoggedin', 'true');
    if (sessionStorage.getItem('isLoggedin')) {
      this.router.navigate(['/']);
    }
  }

}
