const { supabase } = require("../config/supabase");
const express = require("express");
const router = express.Router();

router.get("/api/reports", async (req, res) => {
    try {
        const { data, error } = await supabase
            .from("reportUsers")
            .select("*")
            .order("id", {ascending: false});

        if(error){
            return res.json({ success: false, error });
        }

        res.json({ success: true, data });

    } catch (error) {
        res.json({ success: false, error });
    }
});

module.exports = router;
