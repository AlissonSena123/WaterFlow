import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, Toast } from '../../services/toast.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span id="toast" class="toast" [class.show]="visible" [style.backgroundColor]="current?.color || ''">
      {{ current?.message }}
    </span>
  `
})
export class ToastComponent implements OnInit, OnDestroy {
  current: Toast | null = null;
  visible = false;
  private sub!: Subscription;

  constructor(private toastService: ToastService) {}

  ngOnInit(): void {
    this.sub = this.toastService.toast$.subscribe(toast => {
      if (toast) {
        this.current = toast;
        this.visible = true;
      } else {
        this.visible = false;
      }
    });
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }
}
