import { useState } from 'react';

import { CategoryCheckboxes } from '../../../components/categoryCheckboxes';
import ErrorPage from '../../../components/error';
import { FormField, FormTextField } from '../../../components/formField';
import { getChannelCategories } from '../../../utils/getChannels';
import { getServerUrl } from '../../../utils/getServer';
import { postNewChannelRequest } from '../../../utils/postNewChannelRequest';
import { NewChannelRequest } from '../../../utilsLibrary/newChannelTypes';
import { ResponseWrapper, TResponseWrapper } from '../../../utilsLibrary/responseWrapper';

type Props = {
  serverUrl: string | null;
  error: TResponseWrapper | null;
  channelCategories: string[] | null;
};

export async function getStaticProps() {
  let categories = getChannelCategories();

  let serverUrlResponse = getServerUrl();
  if (!serverUrlResponse.Ok) {
    return {
      props: { error: serverUrlResponse },
    };
  }
  let serverUrl = serverUrlResponse.Message;

  return {
    props: { serverUrl: serverUrl, channelCategories: categories, error: null },
  };
}

export default function Index({ serverUrl, channelCategories, error }: Props) {
  if (error) {
    return <ErrorPage response={error} />;
  }

  if (!channelCategories || !serverUrl) {
    return (
      <ErrorPage
        response={new ResponseWrapper(
          false,
          500,
          "Server Error",
          "Unable to get server and channel categories info."
        ).Serialize()}
      />
    );
  }

  return (
    <AddNewChannelPage
      channelCategories={channelCategories}
      serverUrl={serverUrl}
    />
  );
}

function AddNewChannelPage(props: {
  channelCategories: string[];
  serverUrl: string;
}) {
  // channelName user entered in the form.
  const [channelName, setChannelName] = useState<string>("");

  // categories user selected in the form.
  const [categories, setCategories] = useState<string[]>([]);

  // otherCategorySelected set to true of 'other' value is selected
  const [otherCategorySelected, setOtherCategorySelected] =
    useState<boolean>(false);

  // otherCategory user entered in the form.
  const [otherCategory, setOtherCategory] = useState<string>("");

  // email user entered in the form.
  const [email, setEmail] = useState<string>("");

  // formError set to true if required fields are missing.
  const [formError, setFormError] = useState<boolean>(false);

  // submissionError set to true if server returns error in submitting the form.
  const [submissionError, setSubmissionError] = useState<boolean | null>(null);

  function handleTextInput(event: any) {
    switch (event.target.id) {
      case "channel-name":
        setChannelName(event.target.value);
        break;
      case "email":
        setEmail(event.target.value);
        break;
      case "other-category":
        setOtherCategory(event.target.value);
        break;
    }
  }

  function handleCategoryCheck(event: any) {
    let newArray = [...categories];

    let index = newArray.indexOf(event.target.value);
    if (index > -1) {
      newArray.splice(index, 1);
    } else {
      newArray.push(event.target.value);
    }

    // set/reset otherCategory state
    if (newArray.includes("other")) {
      setOtherCategorySelected(true);
    } else {
      setOtherCategorySelected(false);
      setOtherCategory("");
    }

    setCategories(newArray);
  }

  async function handleSubmit(event: any) {
    event.preventDefault();
    // Check if form has required fields that are missing.
    if (
      channelName.length === 0 ||
      categories.length === 0 ||
      (otherCategorySelected && otherCategory.length === 0)
    ) {
      setFormError(true);
      return;
    }

    // No missing fields, reset FormError.
    setFormError(false);

    // Create request to add newChannel.
    let r: NewChannelRequest = {
      channelName: channelName,
      channelCategories: categories,
      email: email,
    };
    if (otherCategory.length > 0) {
      r.channelCategories.push(otherCategory);
    }

    let response = await postNewChannelRequest(props.serverUrl, r);
    if (!response.Ok) {
      setSubmissionError(true);
    } else {
      setSubmissionError(false);
    }
  }

  // Successful submission of form.
  if (submissionError !== null && !submissionError) {
    return (
      <SuccessOrErrorMessage
        message="New channel request received."
        submessage="Please check back in a few days for the new channel! If an email was provided, a notification will also be sent to the address when the new channel has been added."
      />
    );
  }

  // Submission of form resulted in error.
  if (submissionError !== null && submissionError) {
    return (
      <SuccessOrErrorMessage
        message="There was an error processing your request."
        submessage="Sorry for the inconvenience! Please refresh the page and try again."
      />
    );
  }

  return (
    <div className="w-full md:w-1/2">
      <h1 className="text-4xl font-black">Add a new channel</h1>
      <p className="my-4">
        Fill out this form to submit a new channel to add to the site.{" "}
      </p>
      <form className="mt-4">
        <FormTextField
          id="channel-name"
          label="Channel Name"
          placeholder="Enter channel name"
          required={true}
          value={channelName}
          handleInput={handleTextInput}
        />

        <FormField
          id="channel-categories"
          label="Channel categories"
          placeholder=""
          required={true}
          value={categories}
        >
          <CategoryCheckboxes
            channelCategories={[...props.channelCategories, "other"]}
            handleCategoryCheck={handleCategoryCheck}
            styles={`md:grid-cols-3 lg:grid-cols-3 border ${
              categories.length === 0 ? "border-red-500" : "border-gray"
            }`}
          />
        </FormField>

        {otherCategorySelected && (
          <FormTextField
            id="other-category"
            label="Other categories:"
            placeholder="Enter other categories"
            required={true}
            value={otherCategory}
            handleInput={handleTextInput}
          />
        )}

        <FormTextField
          id="email"
          label="Your Email"
          helperLabel="(An email will be sent to the address below when the new channel has been added.)"
          placeholder="Enter your email"
          required={false}
          value={email}
          handleInput={handleTextInput}
        />
        <button
          type="submit"
          className="bg-theme-yt-red font-medium hover:bg-theme-yt-red-2  p-2 rounded-lg text-white"
          onClick={handleSubmit}
        >
          Submit
        </button>
        {formError && (
          <div className="text-theme-yt-red mt-2 italic">
            Please fill in the required fields first.
          </div>
        )}
      </form>
    </div>
  );
}

function SuccessOrErrorMessage(props: { message: string; submessage: string }) {
  return (
    <>
      <h1 className="text-center my-6 font-black tracking-tight text-3xl">
        {props.message}
      </h1>
      <h3 className="text-center my-4 tracking-tight text-2xl">
        {props.submessage}
      </h3>
    </>
  );
}
