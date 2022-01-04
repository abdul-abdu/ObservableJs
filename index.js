class Observable {
  constructor(subscribe) {
    this._subscribe = subscribe;
  }
  subscribe(observer) {
    return this._subscribe(observer);
  }

  static timeout(time) {
    return new Observable(function subscribe(observer) {
      const handle = setTimeout(function () {
        observer.next();
        observer.complete();
      }, time);

      return {
        unsubscribe() {
          clearTimeout(handle);
        },
      };
    });
  }

  static fromEvent(dom, eventName) {
    return new Observable(function subscribe(observer) {
      const handler = (ev) => {
        observer.next(ev);
      };

      dom.addEventListener(eventName, handler);

      return {
        unsubscribe() {
          dom.removeEventListener(eventName, handler);
        },
      };
    });
  }

  retry(num) {
    const self = this;
    return new Observable(function subscribe(observer) {
      const subscription = self.subscribe({
        next(v) {
          observer.next(v);
        },
        complete() {
          observer.complete();
        },
        error(e) {
          if (num == 0) {
            observer.error(e);
          } else {
            self.retry(num - 1);
          }
        },
      });

      return {
        unsubscribe: () => {
          subscription.unsubscribe();
        },
      };
    });
  }

  map(projection) {
    const self = this;
    return new Observable(function subscribe(observer) {
      const subscription = self.subscribe({
        next(v) {
          observer.next(projection(v));
        },
        error(error) {
          observer.error(error);
        },
        complete() {
          observer.complete();
        },
      });

      return subscription;
    });
  }

  filter(prodicate) {
    const self = this;
    return new Observable(function subscribe(observer) {
      const subscription = self.subscribe({
        next(v) {
          if (prodicate(v)) {
            observer.next(v);
          }
        },
        error(error) {
          observer.error(error);
        },
        complete() {
          observer.complete();
        },
      });

      return subscription;
    });
  }

  static concat(...observables) {
    return new Observable(function subscribe(observer) {
      let myObserbables = observables.slice();
      let subscription = null;

      const processObservable = () => {
        if (myObserbables.length == 0) {
          observer.complete();
        } else {
          let observable = observables.shift();
          subscription = myObserbables.subscribe({
            next(v) {
              observer.next(v);
            },
            error(err) {
              observer.error(err);
              subscription.unsubscribe();
            },
            complete() {
              processObservable();
            },
          });
        }
      };
      processObservable();
      return {
        unsubscribe() {
          subscription.unsubscribe();
        },
      };
    });
  }
}

const btn = document.getElementById("btn");
const clicks = Observable.fromEvent(btn, "click");

const observer = {
  next(v) {
    console.log("next", v);
  },
  complete() {
    console.log("complete");
  },
  error(e) {
    console.log(e);
  },
};

const subscription = clicks
  .map((x) => x.offsetX)
  .filter((offsetX) => offsetX > 10)
  .subscribe(observer);
