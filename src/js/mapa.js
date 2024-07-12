(function() {

    const lat = 20.67444163271174;
    const lng = -103.38739216304566;
    const mapa = L.map('mapa').setView([lat, lng ], 13);
    let marker;

    //utilizar provider y geocoder
    const geocodeService = L.esri.Geocoding.geocodeService();

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(mapa);

    // pin en el mapa

    marker = new L.marker([lat, lng], {
        draggable: true,
        autoPan: true
    })
    .addTo(mapa)

    //detectar el movimiento del pin

    marker.on('moveend', function(e){
        marker = e.target
        const posicion = marker.getLatLng();
        mapa.panTo(new L.LatLng(posicion.lat, posicion.lng))

        //obtener la informacion de las calles al mover el pin
        geocodeService.reverse().latlng(posicion, 13).run(function(error, resultado){

            marker.bindPopup(resultado.address.LongLabel)
        
            //llenar campops
            document.querySelector('.calle').textContent = resultado?.address?.Address ?? '';
            document.querySelector('#calle').value = resultado?.address?.Address ?? '';
            document.querySelector('#lat').textContent = resultado?.latlng?.lat ?? '';
            document.querySelector('#lng').textContent = resultado?.latlng?.lng ?? '';
        })

    })

})()