// decorator convention is to use a capital letter
// function Logger(constructor: Function) {
//     console.log(`Logging: ${constructor}`);
// }

// Option 2 a decorator factory - allows us to pass custom params to our decorator!
function Logger(logString: string) {
  console.log("LOGGER factory function");
  return function (constructor: Function) {
    console.log("LOGGER inner function");
    console.log(logString);
    console.log(constructor);
  };
}

// Decorator that gets added to a class
// function WithTemplate(template: string, hookId: string) {
//     console.log('WITHTEMPLATE factory function');
//   return function (_: Function) {
//     console.log('WITHTEMPLATE inner function');
//       // underscore tells TS that yes I acknowledge I will be passed this param but I
//       // don't need it therefore stop complaining to me.
//     const hookEl = document.getElementById(hookId);
//     if (hookEl) {
//       hookEl.innerHTML = template;
//     }
//   };
// }

// More advanced again we can make use of the constructor fuction for my dynamic
// decorator behaviour
// Class and method decorators can aslo return things such as a new constructor
function WithTemplate(template: string, hookId: string) {
  return function<T extends {new(...args: any[]): {name: string}}>(originalConstructor: T) {
    return class extends originalConstructor {
      constructor(..._: any[]) {
        super();
        console.log('In the extended constructor');
        const hookEl = document.getElementById(hookId);
        if (hookEl) {
          hookEl.innerHTML = template;
          hookEl.querySelector("h1")!.textContent = this.name;
        }
      }
    };
  };
}

// The logger factory function is alled first followed by the the withTemplate.
// However they are actually run in reverse order to bottom up as can be seen in the console logs.
@Logger("LOGGING - Person")
@WithTemplate("<h1>My person object</h1>", "app")
class Person {
  name = 'Rob';

  constructor() {
    console.log("Creating Person object...");
  }
}

const person1 = new Person();

// console.log(person1);

// This is called as soon as the class definition is run I do not not need to instantiate anything.
function Log(target: any, propertyName: string | symbol) {
  console.log("Property Decorator!");
  console.log(target, propertyName);
}

// You can also attach decorators to accessors
function Log2(target: any, name: string, descriptor: PropertyDescriptor) {
  console.log("Accessor Decorator");
  console.log("******************");
  console.log(target);
  console.log(name);
  console.log(descriptor);
}

// You can also attach decorators to methods 
function Log3(
  target: any,
  name: string | symbol,
  descriptor: PropertyDescriptor
) {
  console.log("Method Decorator");
  console.log("******************");
  console.log(target);
  console.log(name);
  console.log(descriptor);
}




// You can also add decorators to parameters
function Log4(target: any, name: string | symbol, position: number) {
  console.log("Parameter Decorator");
  console.log("******************");
  console.log(target);
  console.log(name);
  console.log(position);
}

class Product {
  @Log
  title: string;
  // private _price: number;

  constructor(title: string, private _price: number) {
    this.title = title;
    // this._price = p;
  }

  get price() {
    return this._price;
  }

  @Log2
  set price(val: number) {
    if (val > 0) {
      this._price = val;
    } else {
      throw new Error("Price cannot be a negative number");
    }
  }

  @Log3
  getPriceWithTax(@Log4 tax: number) {
    return this._price * (1 + tax);
  }
}

// const p1 = new Product("headphones", 200);
// const p2 = new Product("book", 7.99);



function AutoBind(_: any, __: string, descriptor: PropertyDescriptor) {
  const orignalMethod = descriptor.value;
  const adjDescription: PropertyDescriptor = {
    configurable: true,
    enumerable: false,
    get() {
      return orignalMethod.bind(this);
    }
  };
  return adjDescription;
}


class Printer {
  message = 'This works!';

  @AutoBind
  showMessage() {
    console.log(this.message);
  }
}


const p = new Printer();
const button = document.querySelector('button')! as HTMLButtonElement;
// This bind is required as the eventListner doesn't bind to the this instance of p.
// button.addEventListener('click', p.showMessage.bind(p));

// This works but only becuase of the Autobind decorator.
button.addEventListener('click', p.showMessage);



// Decorators for validation 

interface ValidatorConfig {
  [property: string]: {
    [validateableProp: string]: string[] // ['required', 'positiveNum']
  };
}

const registeredValidators: ValidatorConfig = {};

function Required(target: any, propName: string) {
  registeredValidators[target.constructor.name] = {
    ...registeredValidators[target.constructor.name],
    [propName]: ['required']
  };
}

function PositiveNumber(target: any, propName: string) {
  registeredValidators[target.constructor.name] = {
    ...registeredValidators[target.constructor.name],
    [propName]: ['positive']
  };
}

function validate(obj: any) {
  const objValidatorConfig = registeredValidators[obj.constructor.name];
  if (!objValidatorConfig) {
    return true;
  };
  let isValid = true;
  for (const prop in objValidatorConfig) {
    for (const validator of objValidatorConfig[prop]) {
      console.log(`Rob debug here ${validator}`);
      switch(validator) {
        case 'required':
          isValid = isValid && !!obj[prop];
          break;
        case 'positive':
          isValid = isValid && obj[prop] > 0;
          break;
      }
    }
  }
  return isValid;
}


class Course {
  @Required
  title: string;
  @PositiveNumber
  price: number;

  constructor(t: string, p: number) {
    this.title = t;
    this.price = p;
  };
}

const courseForm = document.querySelector('form')!;
courseForm.addEventListener('submit', event => {
  event.preventDefault();
  const titleEl = document.getElementById('title') as HTMLInputElement;
  const priceEl = document.getElementById('price') as HTMLInputElement;
  const title = titleEl.value;
  const price = +priceEl.value;
  const createdCourse = new Course(title, price);

  if (!validate(createdCourse)) {
    alert('Invalid input, please try again.');
    return;
  };

  console.log(createdCourse);
});




