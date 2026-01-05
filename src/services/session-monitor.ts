export class SessionMonitor {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;

  start(intervalMinutes: number = 0.117) { // 7 seconds (7/60 = 0.117 minutes)
    if (this.intervalId) return;
    
    this.isRunning = true;
    this.intervalId = setInterval(async () => {
      if (!this.isRunning) return;
      
      try {
        const response = await fetch('/api/auto-complete-sessions', {
          method: 'POST'
        });
        const result = await response.json();
        
        if (result.completed > 0) {
          console.log(`Auto-completed ${result.completed} sessions due to station failures`);
          // Notify user if they're on the statements page
          if (window.location.pathname.includes('/statements')) {
            const event = new CustomEvent('sessionsAutoCompleted', { 
              detail: { count: result.completed } 
            });
            window.dispatchEvent(event);
          }
        }
      } catch (error) {
        console.error('Session monitoring failed:', error);
      }
    }, intervalMinutes * 60 * 1000);
  }

  stop() {
    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  async checkNow() {
    try {
      const response = await fetch('/api/auto-complete-sessions', {
        method: 'POST'
      });
      return await response.json();
    } catch (error) {
      console.error('Manual check failed:', error);
      return { error: 'Check failed' };
    }
  }

  // New method for immediate session monitoring
  async monitorSpecificSession(sessionId: string) {
    try {
      const response = await fetch(`/api/monitor-session/${sessionId}`, {
        method: 'POST'
      });
      return await response.json();
    } catch (error) {
      console.error('Session monitoring failed:', error);
      return { error: 'Monitoring failed' };
    }
  }
}

export const sessionMonitor = new SessionMonitor();