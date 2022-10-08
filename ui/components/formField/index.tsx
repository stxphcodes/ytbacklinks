export function FormTextField(props: {
  id: string;
  label: string;
  helperLabel?:string;
  placeholder: string;
  required: boolean;
  value: string;
  handleInput: any;
}) {
  return (
    <div className="mb-6">
      <label
        className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2"
        htmlFor={props.id}
      >
        {props.label}
      </label>
      <label
        className="block tracking-wide text-gray-700 text-xs mb-2"
        htmlFor={props.id}
      >
        {props.helperLabel}
      </label>
      <input
        className={
          "block bg-gray-200 text-gray-700 rounded py-3 px-4 mb-3 leading-tight focus:outline-none focus:bg-white w-full border " +
          (props.required && props.value.length === 0 ? "border-red-500" : "border-gray")
        }
        id={props.id}
        type="text"
        placeholder={props.placeholder}
        value={props.value}
        onChange={props.handleInput}
      />
      {props.required && props.value.length === 0 && (
        <p className="text-red-500 text-xs italic">
          Please fill out this field.
        </p>
      )}
    </div>
  );
}

export function FormField(props: {
    id: string;
    label: string;
    placeholder: string;
    required: boolean;
    children: JSX.Element;
    value: any;
  }) {
    return (
      <div className="mb-6">
        <label
          className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2"
          htmlFor={props.id}
        >
          {props.label}
        </label>
        {props.children}
        {props.required && props.value.length === 0 && (
          <p className="text-red-500 text-xs italic">
            Please fill out this field.
          </p>
        )}
      </div>
    );
  }
  
  

