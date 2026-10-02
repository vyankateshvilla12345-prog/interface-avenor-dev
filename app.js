let taskId = null;

let models = [];


const $ = (
    id
) => document.getElementById(id);


async function getJSON(
    url,
    options = {}
) {

    const response =
        await fetch(
            url,
            options
        );

    const data =
        await response.json();

    if (!response.ok) {

        throw new Error(
            data.detail ||
            "Request failed"
        );
    }

    return data;
}


async function loadConfig() {

    const config =
        await getJSON(
            "/api/config"
        );


    const keySelects = [

        $("key"),

        $("changeKey")

    ];


    for (
        const select
        of keySelects
    ) {

        select.innerHTML = "";


        for (
            const key
            of config.keys
        ) {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                key.number;

            option.textContent =
                key.label;

            select.appendChild(
                option
            );
        }

    }


    try {

        models =
            await getJSON(
                "/api/models"
            );

    } catch {

        models = [

            {
                id:
                    config.default_model,

                name:
                    config.default_model

            }

        ];

    }


    fillModels(
        $("model")
    );

    fillModels(
        $("changeModel")
    );
}


function fillModels(
    select
) {

    select.innerHTML = "";


    for (
        const model
        of models.slice(
            0,
            100
        )
    ) {

        const option =
            document.createElement(
                "option"
            );

        option.value =
            model.id;

        let text =
            model.name ||
            model.id;


        if (
            model.context_length
        ) {

            text +=
                ` • ${
                    Number(
                        model.context_length
                    ).toLocaleString()
                } context`;

        }


        option.textContent =
            text;

        select.appendChild(
            option
        );
    }
}


function setStatus(
    status
) {

    $("statusBadge")
        .textContent =
        status;
}


function render(
    state
) {

    $("taskPanel")
        .classList
        .remove(
            "hidden"
        );


    $("taskId")
        .textContent =
        state.task_id;


    $("progressBar")
        .style
        .width =
        `${state.progress || 0}%`;


    $("progressText")
        .textContent =
        `${state.progress || 0}% • Step ${state.step}`;


    setStatus(
        state.status
    );


    const finished =
        state.status ===
        "finished";


    $("download")
        .classList
        .toggle(
            "hidden",
            !finished
        );


    if (taskId) {

        $("download")
            .href =
            `/api/tasks/${taskId}/download`;

    }


    const needsChoice =

        state.status ===
            "needs_selection"

        ||

        state.status ===
            "waiting_for_user";


    $("selectionBox")
        .classList
        .toggle(
            "hidden",
            !needsChoice
        );


    $("question")
        .textContent =

        state.question ||

        state.last_error ||

        "Choose another API key or model to continue.";


    $("log")
        .textContent =

        `Model: ${state.model}\n` +

        `API Key: #${state.key_number}\n` +

        `Checkpoint: ${state.step}\n\n` +

        `${state.summary || "Working..."}` +

        (

            state.last_error

            ?

            `\n\nError:\n${state.last_error}`

            :

            ""

        );


    $("files")
        .innerHTML = "";


    for (
        const file
        of (
            state.files ||
            []
        )
    ) {

        const li =
            document.createElement(
                "li"
            );

        li.textContent =
            file;

        $("files")
            .appendChild(
                li
            );
    }
}


async function startTask() {

    const prompt =
        $("prompt")
            .value
            .trim();


    if (!prompt) {

        alert(
            "Enter a task first."
        );

        return;
    }


    $("start")
        .disabled =
        true;


    setStatus(
        "Starting..."
    );


    try {

        const state =
            await getJSON(
                "/api/tasks",
                {

                    method:
                        "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify({

                            prompt:

                                prompt,

                            model:

                                $("model")
                                    .value,

                            key_number:

                                Number(
                                    $("key")
                                        .value
                                )

                        })

                }
            );


        taskId =
            state.task_id;


        render(
            state
        );


    } catch (
        error
    ) {

        alert(
            error.message
        );

        setStatus(
            "Error"
        );

    } finally {

        $("start")
            .disabled =
            false;
    }
}


async function continueTask() {

    if (!taskId) {
        return;
    }


    $("continue")
        .disabled =
        true;


    try {

        const state =
            await getJSON(

                `/api/tasks/${taskId}/continue`,

                {

                    method:
                        "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify({

                            model:

                                $("changeModel")
                                    .value,

                            key_number:

                                Number(
                                    $("changeKey")
                                        .value
                                )

                        })

                }

            );


        render(
            state
        );


    } catch (
        error
    ) {

        alert(
            error.message
        );

    } finally {

        $("continue")
            .disabled =
            false;
    }
}


$("start")
    .addEventListener(
        "click",
        startTask
    );


$("continue")
    .addEventListener(
        "click",
        continueTask
    );


loadConfig()
    .catch(
        error =>
            alert(
                error.message
            )
    );