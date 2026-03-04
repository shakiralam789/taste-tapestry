import type * as React from "react";

declare module "react-hook-form" {
  export interface FieldError {
    message?: string;
  }

  export interface FormState<TFieldValues extends Record<string, unknown>> {
    errors: {
      [K in keyof TFieldValues]?: FieldError;
    };
    isSubmitting: boolean;
  }

  export interface UseFormReturn<
    TFieldValues extends Record<string, unknown>,
  > {
    register: (
      name: keyof TFieldValues,
      options?: unknown,
    ) => Record<string, unknown>;
    handleSubmit: (
      onValid: (values: TFieldValues) => unknown,
    ) => (event?: unknown) => unknown;
    formState: FormState<TFieldValues>;
    watch: (name?: keyof TFieldValues) => unknown;
  }

  export function useForm<
    TFieldValues extends Record<string, unknown> = Record<string, unknown>,
  >(): UseFormReturn<TFieldValues>;

  // Minimal extra types to support shared form components
  export interface FieldValues {
    [key: string]: unknown;
  }

  export type FieldPath<TFieldValues extends FieldValues> = Extract<
    keyof TFieldValues,
    string
  >;

  export interface ControllerProps<
    TFieldValues extends FieldValues = FieldValues,
    TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
  > {
    name: TName;
    control?: unknown;
    rules?: Record<string, unknown>;
    defaultValue?: unknown;
    render?: (props: { field: Record<string, unknown> }) => React.ReactElement | null;
  }

  export const Controller: React.ComponentType<ControllerProps>;

  export interface FormProviderProps<
    TFieldValues extends FieldValues = FieldValues,
  > {
    children?: React.ReactNode;
    // Allow any additional props from useForm methods spread
    [key: string]: unknown;
  }

  export const FormProvider: React.ComponentType<FormProviderProps>;

  export interface UseFormContextReturn<
    TFieldValues extends FieldValues = FieldValues,
  > {
    getFieldState: (
      name: FieldPath<TFieldValues>,
      formState?: FormState<TFieldValues>,
    ) => { error?: FieldError } & Record<string, unknown>;
    formState: FormState<TFieldValues>;
  }

  export function useFormContext<
    TFieldValues extends FieldValues = FieldValues,
  >(): UseFormContextReturn<TFieldValues>;
}

