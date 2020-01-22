'use strict';

(function () {
  const template = document.createElement('template');

  template.innerHTML = `
    <style>
         h2 {
      font-weight: bold;
      font-size: 25px;
    }
    .cityIcon {
      float:left;
      vertical-align: text-top;
      border: solid 1px lightgray;
      margin-right: 10px;
      width: 50px;
      height: 50px;
      object-fit: cover;
    }
    .wiki{
      font-size: 90%;
    }
  
    </style>

    <script>
      // console.log("Template instanciado");
    </script>

     <h2>
        <img class="cityIcon"
             src="";
            alt="">
       Cuestionario sobre <span id="tema"></span> 
    </h2>
  `;

  class Operaciones extends HTMLElement {
    constructor() {
      super();
      let clone = template.content.cloneNode(true);
      let shadowRoot = this.attachShadow({
        mode: 'open'
      });
      shadowRoot.appendChild(clone);
    }

    connectedCallback() {
      var componente = this;
      // console.log(componente);
      componente.tema = componente.getAttribute("tema");
      componente.shadowRoot.querySelector('#tema').textContent = componente.tema;

      let desc = document.createElement("div");
      desc.className = "wiki";
      desc.textContent = "";

      fetch("https://es.wikipedia.org/w/api.php?origin=*&format=json&action=query&prop=extracts&exintro&explaintext&continue&titles=" + componente.tema)
        .then(response => {
          response.json().then(json => {
            // console.log(json);
            var pages = json.query.pages;
            var article = Object.values(pages)[0];

            desc.textContent = article.extract.replace(/\[([0-9])*]/g, "");

            componente.shadowRoot.appendChild(desc);
          })
        })
        .catch(error => {
          console.log('Ha habido un problema: ', error);
        });

      fetch("https://www.flickr.com/services/rest/?method=flickr.photos.search&api_key=866a859ee866f47a6948e5844b44449d&tags=" + componente.tema + "&format=json&nojsoncallback=1")
        .then(function (response) {
          if (!response.ok) {
            throw Error(response.statusText);
          }
          return response.json();
        })
        .then(function (json) {
          // console.log(json);
          let photo = json.photos.photo[0];
          componente.shadowRoot.querySelector(".cityIcon").src = "https://farm" + photo.farm + ".staticflickr.com/" + photo.server + "/" + photo.id + "_" + photo.secret + ".jpg";
          componente.shadowRoot.querySelector(".cityIcon").onerror= "this.src='https://eoimages.gsfc.nasa.gov/images/imagerecords/57000/57723/globe_east_540.jpg'"
        })
        .catch(function (error) {
          componente.shadowRoot.querySelector(".cityIcon").src = 'https://eoimages.gsfc.nasa.gov/images/imagerecords/57000/57723/globe_east_540.jpg';
        });
    }
  }

  customElements.define("encabezado-cuestionario", Operaciones);

})();
