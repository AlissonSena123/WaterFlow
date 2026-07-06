import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Toast {
  message: string;
  color: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private _toast$ = new BehaviorSubject<Toast | null>(null);
  toast$ = this._toast$.asObservable();

  show(message: string, color: string = '#333'): void {
    this._toast$.next({ message, color });
    setTimeout(() => this._toast$.next(null), 3000);
  }

  success(message: string): void {
    this.show(message, '#22c55e');
  }

  error(message: string): void {
    this.show(message, '#ef4444');
  }
}
