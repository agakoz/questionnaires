'use strict';
let old;
const base = "/carrito/v1";
let cuestionario = "";

const cabeceras = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
};

function print(r) {
    // const e= document.querySelector('#mensaje');
    if (!r.result) {
        //     e.textContent= JSON.stringify(r.result);
        // }
        // else {
        // e.textContent= JSON.stringify(r.error);
        window.alert(JSON.stringify(r.error));
    }
}

function printError(s) {
    // const e= document.querySelector('#mensaje');
    // e.textContent= `Problema de conexión: ${s}`;
    window.alert(`Problema de conexión: ${s}`);
}

function insertAsLastChild(padre, nuevoHijo) {
    padre.appendChild(nuevoHijo);
}

//inserta el nodo nuevoHijo como primer hijo del nodo padre.
function insertAsFirstChild(padre, nuevoHijo) {
    padre.insertBefore(nuevoHijo, padre.firstChild);
}

//inserta el nodo nuevoHijo como hijo del nodo padre inmediatamente antes del nodo hijo.
function insertBeforeChild(padre, hijo, nuevoHijo) {
    padre.insertBefore(nuevoHijo, hijo);

}

//elimina del DOM el nodo pasado como parámetro.
function removeElement(nodo) {
    nodo.remove();
}

function queryAncestorSelector(node, selector) {
    var parent = node.parentNode;
    var all = document.querySelectorAll(selector);
    var found = false;
    while (parent !== document && !found) {
        for (var i = 0; i < all.length && !found; i++) {
            found = (all[i] === parent) ? true : false;
        }
        parent = (!found) ? parent.parentNode : parent;
    }
    return (found) ? parent : null;
}

function addCruzToCuest(node) {
    let cruz = document.createElement("div");

    cruz.className = "borraCuest";
    cruz.textContent = "☒";

    insertAsFirstChild(node, cruz);
    cruz.onclick = borraCuestionario;

}

function addCruz(node) {

    let cruz = document.createElement("div");
    cruz.className = "borra";
    cruz.textContent = "☒";
    insertAsFirstChild(node, cruz);
    cruz.onclick = borraPregunta;

}

function goUpPregunta(event) {
    let node = queryAncestorSelector(event.target, ".bloque");
    // let pregunta = node.querySelector(".pregunta")
    let sect = node.parentNode;
    let earlier;
    let temp;
    let childrenList = sect.childNodes;
    if (childrenList[4] !== node) {
        for (let i = 0; i < childrenList.length; i++) {
            if (childrenList[i] === node) {
                if(childrenList[i-1].getAttribute('highlight')!=='true')
                insertBeforeChild(sect, childrenList[i - 1], node)


            }
        }
    }

}

function addArrowUpPregunta(node) {

    let cruz = document.createElement("div");
    cruz.className = "up";
    cruz.textContent = "⇑";
    insertAsFirstChild(node, cruz);
    cruz.onclick = goUpPregunta;

}

function goDownPregunta(event) {
    let node = queryAncestorSelector(event.target, ".bloque");
    // let pregunta = node.querySelector(".pregunta")
    let sect = node.parentNode;

    let childrenList = sect.childNodes;
    if (node !== sect.lastChild) {
        for (let i = 0; i < childrenList.length; i++) {
            if (childrenList[i] === node) {
                insertBeforeChild(sect, node, childrenList[i + 1])


            }
        }
    }

}

function addArrowDownPregunta(node) {

    let cruz = document.createElement("div");
    cruz.className = "down";
    cruz.textContent = "⇓";
    insertAsFirstChild(node, cruz);
    cruz.onclick = goDownPregunta;

}

function addEdit(node) {
    let pencil = document.createElement("div");
    pencil.className = "edit";
    pencil.textContent = "✎";
    insertAsFirstChild(node, pencil);

    pencil.onclick = editPregunta;

}

function editPregunta(event) {
    let node = queryAncestorSelector(event.target, ".bloque");
    let pregunta = node.querySelector(".pregunta");
    let pencil = node.querySelector(".edit");
    let sect = node.parentNode;
    old = pregunta.textContent;
    //   console.log(old);
    pregunta.classList.add("editable");
    pencil.classList.add("editable");
    pregunta.setAttribute("contenteditable", "true");

    pencil.onclick = saveEditedPregunta;


}


function saveEditedPregunta(event) {

    let node = queryAncestorSelector(event.target, ".bloque");
    let pregunta = node.querySelector(".pregunta");
    let pencil = node.querySelector(".edit");
    let sect = node.parentNode;


    cuestionario = sect.querySelector("encabezado-cuestionario").tema;
    event.preventDefault();

    const url = `${base}/${cuestionario}/${old}`;
    const payload = {
        tema: cuestionario,
        texto: pregunta.textContent,

    };
    const request = {
        method: 'PUT',
        headers: cabeceras,
        body: JSON.stringify(payload),
    };
    console.log(url);
    fetch(url, request)
        .then(response => response.json())
        .then(r => {
            if (r.error == null) {

                pregunta.classList.remove("editable");
                pencil.classList.remove("editable");
                pregunta.setAttribute("contenteditable", "false");
                pencil.onclick = editPregunta;
                print(r);


            } else
                print(r);
        })
        .catch(error => printError(error));

}

function addCollapse(node) {
    let arrow = document.createElement("div");
    arrow.className = "collapseArrow";
    arrow.textContent = (node.getAttribute("collapsed") === "false") ? "▲" : "▼";
    insertAsFirstChild(node, arrow);

    arrow.onclick = collapse;

}

function collapse(event) {

    let sect = queryAncestorSelector(event.target, ".cuestionario");
    //  let pregunta = node.querySelector(".pregunta");
    let collapseArrow = sect.querySelector(".collapseArrow");
    //let sect = node.parentNode;
    let toCollapse = (sect.getAttribute('collapsed') === "false") ? "true" : "false";

    cuestionario = sect.querySelector("encabezado-cuestionario").tema;
    event.preventDefault();

    const url = `${base}/${cuestionario}`;
    const payload = {
        tema: cuestionario,
        collapsed: toCollapse,

    };
    const request = {
        method: 'PUT',
        headers: cabeceras,
        body: JSON.stringify(payload),
    };
    fetch(url, request)
        .then(response => response.json())
        .then(r => {
            if (r.error == null) {

                collapseArrow.textContent = (toCollapse === "true") ? "▼" : "▲";
                sect.setAttribute("collapsed", toCollapse);
                print(r);


            } else
                print(r);
        })
        .catch(error => printError(error));
}

function addStar(node) {
    let star = document.createElement("div");
    star.className = "star";
    star.textContent = "★";
    insertAsFirstChild(node, star);

    star.onclick = highlight;

}

function highlight(event) {
    let node = queryAncestorSelector(event.target, '.bloque');
    let sect = node.parentNode;
    console.log(node.getAttribute('highlight'));
    let toHighlight = (node.getAttribute('highlight') === 'false') ? 'true' : 'false';
    let pregunta = node.querySelector('.pregunta');
    cuestionario = sect.querySelector("encabezado-cuestionario").tema;
    event.preventDefault();

    let url = `${base}/${cuestionario}/${pregunta.textContent}`;
    const payload = {
        highlight: toHighlight,

    };
    const request = {
        method: 'PUT',
        headers: cabeceras,
        body: JSON.stringify(payload),
    };
    console.log(url);
    fetch(url, request)
        .then(response => response.json())
        .then(r => {
            if (r.error == null) {

                node.setAttribute("highlight", toHighlight);
                if (toHighlight === 'true') {
                    if(node!== sect.querySelector('.bloque'))
                    insertBeforeChild(sect, sect.querySelector('.bloque'), node)
                }
                print(r);


            } else
                print(r);
        })
        .catch(error => printError(error));


}

function addFormPregunta(node) {
    let prefix = node.getAttribute("id");

    let li1 = document.createElement("li");
    let lab1 = document.createElement("label");
    lab1.textContent = "Enunciado de la pregunta:";
    let inp1 = document.createElement("input");
    inp1.type = "text";
    inp1.name = prefix + "_pregunta";
    inp1.className = "preguntaInputBox"
    li1.appendChild(lab1);
    li1.appendChild(inp1);

    let li2 = document.createElement("li");
    let lab2 = document.createElement("label");
    lab2.textContent = "Respuesta:";
    let inp21 = document.createElement("input");
    inp21.type = "radio";
    inp21.name = prefix + "_respuesta";
    inp21.value = "true";
    inp21.checked = true;


    inp21.className = "RadioRespuestaVerdadero";
    let inp21Label = document.createTextNode("Verdadero");
    let inp22 = document.createElement("input");
    inp22.type = "radio";
    inp22.name = prefix + "_respuesta";
    inp22.value = "falso";
    inp22.className = "RadioRespuestaFalso";
    let inp22Label = document.createTextNode("Falso");


    li2.appendChild(lab2);
    li2.appendChild(inp21);
    li2.appendChild(inp21Label);
    li2.appendChild(inp22);
    li2.appendChild(inp22Label);

    let li3 = document.createElement("li");
    let inp3 = document.createElement("input");
    inp3.type = "button";
    inp3.value = "Añadir nueva pregunta";
    li3.appendChild(inp3);

    let ulist = document.createElement("ul");
    ulist.appendChild(li1);
    ulist.appendChild(li2);
    ulist.appendChild(li3);


    let form = document.createElement("div");
    form.className = "formulario";
    form.appendChild(ulist);

    insertBeforeChild(node, node.querySelector(".bloque"), form);
    inp3.onclick = nuevaPregunta;
}

function showPreguntas() {
    let cuestionarios = document.querySelectorAll(".cuestionario");

    for (var i = 0; i < cuestionarios.length; i++) {
        let sect = cuestionarios[i];
        cuestionario = sect.querySelector("encabezado-cuestionario").tema;
        let url = `${base}/${cuestionario}/preguntas`;
        const request = {
            method: 'GET',
            headers: cabeceras,
        };
        // console.log(url);
        //console.log(request);
        let highlightedQuestion;
        fetch(url, request)
            .then(response => response.json())
            .then(r => {
                if (r.error == null) {

                    for (var j = 0; j < r.result.length; j++) {

                        let bloque = document.createElement("div");
                        bloque.className = "bloque";
                        //bloque.id = r.result;
                        bloque.setAttribute('highlight', r.result[j].highlight);


                        console.log(bloque.getAttribute('highlight'));
                        let pregunta = document.createElement("div");
                        pregunta.className = "pregunta";
                        pregunta.textContent = r.result[j].texto;


                        let respuesta = document.createElement("div");
                        respuesta.className = "respuesta";

                        let resp = r.result[j].respuesta;
                        respuesta.setAttribute("data-valor", resp);

                        bloque.appendChild(pregunta);
                        bloque.appendChild(respuesta);

                        addCruz(bloque);
                        addArrowUpPregunta(bloque);
                        addArrowDownPregunta(bloque);
                        addEdit(bloque);
                        addStar(bloque);
                        // if(bloque.getAttribute('highlight')==='yes') insertBeforeChild(sect.querySelector('.bloque');
                        // else
                            insertAsLastChild(sect, bloque)
                    }
                }
            })
            .catch(error => printError(error));
    }

}

function showCuestionarios() {
    const url = `${base}/cuestionarios`;
    const request = {
        method: 'GET',
        headers: cabeceras,
    };
    fetch(url, request)
        .then(response => response.json())
        .then(r => {
            if (r.error == null) {

                const e = document.querySelector('#listado');
                e.innerHTML = '';
                let navigationList = document.querySelector(".navi");
                navigationList.innerHTML = '';
                if (r.result) {
                    for (var i = 0; i < r.result.length; i++) {

                        cuestionario = r.result[i].tema;

                        let sect = document.createElement("section");
                        sect.id = cuestionario;
                        sect.className = "cuestionario";
                        sect.setAttribute('collapsed', r.result[i].collapsed);
                        //console.log(sect.getAttribute('data-collapsed'));
                        let en_cu = document.createElement("encabezado-cuestionario");
                        en_cu.setAttribute("tema", cuestionario); //${r.result[i].tema}
                        en_cu.textContent = "";

                        sect.appendChild(en_cu);

                        e.appendChild(sect);
                        addCruzToCuest(sect);
                        addFormPregunta(sect);
                        addCollapse(sect);

                        let li = document.createElement("li");
                        let a = document.createElement("a");
                        a.textContent = r.result[i].tema;
                        a.href = "#" + sect.getAttribute("id");
                        li.appendChild(a);
                        insertAsLastChild(navigationList, li);

                    }
                    showPreguntas();
                }
            } else print(r);
        })
        .catch(error => printError(error));
}


function nuevaPregunta(event) {
    let section = queryAncestorSelector(event.target, "section");

    cuestionario = section.querySelector("encabezado-cuestionario").tema;
    //cuestionario = section.id;
    event.preventDefault();
    const url = `${base}/${cuestionario}/preguntas`;
    const payload = {
        tema: cuestionario,
        texto: section.querySelector("input").value,
        respuesta: (section.querySelectorAll("input")[1].checked === true) ?
            section.querySelectorAll("input")[1].value : section.querySelectorAll("input")[2].value,
        highlight: 'false'
    };
    const request = {
        method: 'POST',
        headers: cabeceras,
        body: JSON.stringify(payload),
    };
    fetch(url, request)
        .then(response => response.json())
        .then(r => {
            if (r.error == null) {
                let section = queryAncestorSelector(event.target, "section");
                let preguntaBox = section.querySelector("input");
                let bloque = document.createElement("div");
                bloque.className = "bloque";
                bloque.data_id = r.result;

                let pregunta = document.createElement("div");
                pregunta.className = "pregunta";
                pregunta.textContent = preguntaBox.value;


                let respuesta = document.createElement("div");
                respuesta.className = "respuesta";

                let resp = (section.querySelectorAll("input")[1].checked === true) ?
                    section.querySelectorAll("input")[1].value : section.querySelectorAll("input")[2].value;
                respuesta.setAttribute("data-valor", resp);

                bloque.appendChild(pregunta);
                bloque.appendChild(respuesta);

                addCruz(bloque);
                addArrowUpPregunta(bloque);
                addArrowDownPregunta(bloque);
                addEdit(bloque);
                addStar(bloque);

                insertAsLastChild(section, bloque)

                section.querySelectorAll("input")[0].value = "";
                section.querySelectorAll("input")[1].checked = true;

                print(r);


            } else
                print(r);
        })
        .catch(error => printError(error));
}


function addCuestionario(event) {
    let formulrio = queryAncestorSelector(event.target, ".formulario");
    let temaBox = formulrio.querySelector("input");
    //console.log(temaBox.value);
    event.preventDefault();
    const url = `${base}/cuestionarios`;
    const payload = {
        tema: temaBox.value,
        collapsed: "false"
    };
    const request = {
        method: 'POST',
        headers: cabeceras,
        body: JSON.stringify(payload),
    };
    fetch(url, request)
        .then(response => response.json())
        .then(r => {
            if (r.error == null) {

                const e = document.querySelector('#listado');
                let sect = document.createElement("section");
                //  sect.id = r.result;
                // sect.setAttribute('data-collapsed', "0");
                // console.log(sect.getAttribute(data-collapsed))
                let tema = temaBox.value;
                sect.id = tema;
                sect.className = "cuestionario";
                sect.setAttribute('collapsed', "false");
                //console.log(sect.getAttribute('collapsed'));
                let en_cu = document.createElement("encabezado-cuestionario");
                en_cu.setAttribute("tema", tema)
                en_cu.textContent = "";
                // console.log(en_cu.tema);
                sect.appendChild(en_cu);
                addCruzToCuest(sect);

                //   let main = document.querySelector("main");
                e.appendChild(sect);
                addCollapse(sect);

                addFormPregunta(sect);

                let navigationList = document.querySelector(".navi");
                let li = document.createElement("li");
                let a = document.createElement("a");
                a.textContent = temaBox.value;
                a.href = "#" + sect.getAttribute("id");
                li.appendChild(a);
                insertAsLastChild(navigationList, li);


                print(r);
                temaBox.value = "";
            }
            print(r);
        })
        .catch(error => printError(error));


}

function borraCuestionario(event) {
    let sect = queryAncestorSelector(event.target, ".cuestionario");
    cuestionario = sect.querySelector("encabezado-cuestionario").tema;
    let url = '';
    event.preventDefault();
    url = `${base}/${cuestionario}`;
    const payload = {};

    var request = {
        method: 'DELETE',
        headers: cabeceras,
        body: JSON.stringify(payload),
    };

    fetch(url, request)
        .then(response => response.json())
        .then(r => {
            if (r.error == null) {
                let navigation = document.querySelector(".navi");
                let navigationList = navigation.querySelectorAll("a");
                for (let i = 0; i < navigationList.length; i++) {
                    if (navigationList[i].getAttribute("href") === "#" + sect.getAttribute("id")) {
                        let row = navigationList[i].parentNode;
                        removeElement(row);
                        break;
                    }
                }
                removeElement(sect);
            }
            print(r);
        })
        .catch(error => printError(error));
}

function borraPregunta(event) {
    let node = queryAncestorSelector(event.target, ".bloque");
    let pregunta = node.querySelector(".pregunta")
    let sect = node.parentNode;
    cuestionario = sect.querySelector("encabezado-cuestionario").tema;
    let url = '';
    event.preventDefault();

    if (sect.childElementCount > 5) { //elimina pregunta
        //const pregid = queryAncestorSelector(event.target, ".bloque").id;
        url = `${base}/${cuestionario}/preguntas/${pregunta.textContent}`;
        const payload = {};

        var request = {
            method: 'DELETE',
            headers: cabeceras,
            body: JSON.stringify(payload),
        };

        fetch(url, request)
            .then(response => response.json())
            .then(r => {
                if (r.error == null) {
                    print(r);
                    removeElement(node);
                }
                print(r);
            })
            .catch(error => printError(error));

    } else { //elimina cuestionario
        url = `${base}/${cuestionario}`;
        const payload = {};

        var request = {
            method: 'DELETE',
            headers: cabeceras,
            body: JSON.stringify(payload),
        };

        fetch(url, request)
            .then(response => response.json())
            .then(r => {
                if (r.error == null) {


                    let navigation = document.querySelector(".navi");
                    let navigationList = navigation.querySelectorAll("a");
                    for (let i = 0; i < navigationList.length; i++) {
                        if (navigationList[i].getAttribute("href") === "#" + sect.getAttribute("id")) {
                            let row = navigationList[i].parentNode;
                            removeElement(row);
                            break;
                        }
                    }
                    removeElement(sect);
                }
                print(r);
            })
            .catch(error => printError(error));
    }


}


//-----------------------------------------------------
function init() {

    let form = document.getElementById("nuevoCuestionario");
    let inputs = form.querySelectorAll("input");
    inputs[1].onclick = addCuestionario;

    showCuestionarios();//--------------------------------------------


}

document.addEventListener("DOMContentLoaded", init);

