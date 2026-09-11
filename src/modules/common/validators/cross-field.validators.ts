import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'atLeastOneTrue', async: false })
class AtLeastOneTrueConstraint implements ValidatorConstraintInterface {
  validate(_value: unknown, args: ValidationArguments): boolean {
    const [properties] = args.constraints as [string[]];
    const object = args.object as Record<string, unknown>;

    const ningunoFuePasado = properties.every(
      (property) => object[property] === undefined,
    );
    if (ningunoFuePasado) return true;

    return properties.some((property) => object[property] === true);
  }

  defaultMessage(args: ValidationArguments): string {
    const [, message] = args.constraints as [string[], string | undefined];
    return message ?? 'Debe seleccionar al menos una de las opciones.';
  }
}

/**
 * Exige que al menos uno de los booleanos listados en `properties` sea `true`.
 * Si ninguno de los campos llega en el payload (ej. un update parcial que no
 * los toca), no valida nada.
 */
export function AtLeastOneTrue(
  properties: string[],
  message?: string,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [properties, message],
      validator: AtLeastOneTrueConstraint,
    });
  };
}

@ValidatorConstraint({ name: 'greaterThanOrEqualToProperty', async: false })
class GreaterThanOrEqualToPropertyConstraint
  implements ValidatorConstraintInterface
{
  validate(value: unknown, args: ValidationArguments): boolean {
    const [relatedProperty] = args.constraints as [string];
    const relatedValue = (args.object as Record<string, unknown>)[
      relatedProperty
    ];

    if (value == null || relatedValue == null) return true;
    if (typeof value !== 'number' || typeof relatedValue !== 'number')
      return true;

    return value >= relatedValue;
  }

  defaultMessage(args: ValidationArguments): string {
    const [relatedProperty, message] = args.constraints as [
      string,
      string | undefined,
    ];
    return message ?? `Debe ser mayor o igual que ${relatedProperty}.`;
  }
}

/**
 * Exige que el campo decorado sea >= al valor de `relatedProperty`.
 * Si alguno de los dos valores es null/undefined, no valida (coincide con
 * el comportamiento ya existente en el schema yup del frontend).
 */
export function IsGreaterThanOrEqualToProperty(
  relatedProperty: string,
  message?: string,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [relatedProperty, message],
      validator: GreaterThanOrEqualToPropertyConstraint,
    });
  };
}
